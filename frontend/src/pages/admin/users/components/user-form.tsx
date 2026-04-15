import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, Check, ChevronsUpDown, ImagePlus, Info, ShieldCheck, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getApiErrorMessage, getSupabaseFunctionErrorMessage } from '@/lib/supabase-function-errors'
import { getSupabaseFunctionHeaders } from '@/lib/supabase-function-headers'
import {
  buildUserPhotoPath,
  CITY_WIDE_ROLES,
  formatDateTime,
  formatUserDisplayName,
  getProfileWarnings,
  getRoleLabel,
  MOBILE_NUMBER_PATTERN,
  ROLE_OPTIONS,
  STATION_REQUIRED_ROLES,
  USER_ID_PATTERN,
  USER_PROFILE_PHOTO_BUCKET,
} from '@/lib/user-profiles'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { UserProfile, UserRole } from '@/types'
import { UserAvatar } from '@/components/user-avatar'
import { DEFAULT_ADMIN_USERS_SEARCH } from '../search'

interface HealthStation {
  id: string
  name: string
}

interface UserFormProps {
  mode: 'create' | 'edit'
  userId?: string
}

interface UserFormValues {
  user_id: string
  first_name: string
  middle_name: string
  last_name: string
  name_suffix: string
  email: string
  username: string
  date_of_birth: string
  sex: 'M' | 'F' | ''
  mobile_number: string
  alternate_mobile_number: string
  role: UserRole | ''
  health_station_id: string
  purok_assignment: string
  coverage_notes: string
  admin_notes: string
  must_change_password: boolean
  is_active: boolean
  deactivation_reason: string
  password: string
}

const ROLE_DESCRIPTIONS: Record<UserRole, { description: string; access: string[] }> = {
  bhw: {
    description: 'Field-level health worker capturing household and patient activity within an assigned barangay.',
    access: ['Patient registration', 'Visit capture', 'Offline data entry', 'Barangay-scoped data only'],
  },
  midwife_rhm: {
    description: 'Validates BHW submissions, manages TCL records, and oversees one health station.',
    access: ['Validation queue', 'TCL maintenance', 'Summary tables', 'Station-scoped operations'],
  },
  nurse_phn: {
    description: 'City-wide nurse handling report consolidation from all barangays.',
    access: ['ST review', 'MCT consolidation', 'City-wide analytics', 'Cross-BHS reporting'],
  },
  phis_coordinator: {
    description: 'Runs DQC and official FHSIS report exports across the city.',
    access: ['M1/M2 exports', 'Data quality checks', 'City-wide reporting queue'],
  },
  dso: {
    description: 'Monitors disease alerts and surveillance workflows across all health stations.',
    access: ['Real-time disease alerts', 'PIDSR logs', 'Disease map', 'Compliance monitoring'],
  },
  city_health_officer: {
    description: 'Approves city-wide outputs and monitors health intelligence at executive level.',
    access: ['Report sign-off', 'Archive review', 'Forecast and trend visibility'],
  },
  system_admin: {
    description: 'Maintains users, stations, access settings, and audit-sensitive configuration.',
    access: ['Full user management', 'BHS registry', 'System configuration', 'Audit-aware changes'],
  },
}

const EMPTY_FORM: UserFormValues = {
  user_id: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  name_suffix: '',
  email: '',
  username: '',
  date_of_birth: '',
  sex: '',
  mobile_number: '',
  alternate_mobile_number: '',
  role: '',
  health_station_id: '',
  purok_assignment: '',
  coverage_notes: '',
  admin_notes: '',
  must_change_password: true,
  is_active: true,
  deactivation_reason: '',
  password: '',
}

const PROFILE_PHOTO_MAX_BYTES = 2 * 1024 * 1024
const PROFILE_PHOTO_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function UserForm({ mode, userId }: UserFormProps) {
  const navigate = useNavigate()
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const [form, setForm] = useState<UserFormValues>(EMPTY_FORM)
  const [healthStations, setHealthStations] = useState<HealthStation[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [currentPhotoPath, setCurrentPhotoPath] = useState<string | null>(null)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [usernameTouched, setUsernameTouched] = useState(mode === 'edit')

  useEffect(() => {
    if (!selectedPhotoFile) {
      setPhotoPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedPhotoFile)
    setPhotoPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedPhotoFile])

  useEffect(() => {
    void supabase
      .from('health_stations')
      .select('id, name')
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          setSubmitError(error.message)
          return
        }
        setHealthStations(data ?? [])
      })
  }, [])

  useEffect(() => {
    if (mode !== 'edit' || !userId) {
      return
    }

    void supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setSubmitError(error?.message ?? 'Could not load this user.')
          setLoading(false)
          return
        }

        const profile = data as UserProfile
        setCurrentUser(profile)
        setCurrentPhotoPath(profile.profile_photo_path)
        setForm({
          user_id: profile.user_id,
          first_name: profile.first_name,
          middle_name: profile.middle_name ?? '',
          last_name: profile.last_name,
          name_suffix: profile.name_suffix ?? '',
          email: profile.email,
          username: profile.username,
          date_of_birth: profile.date_of_birth,
          sex: profile.sex,
          mobile_number: profile.mobile_number ?? '',
          alternate_mobile_number: profile.alternate_mobile_number ?? '',
          role: profile.role,
          health_station_id: profile.health_station_id ?? '',
          purok_assignment: profile.purok_assignment ?? '',
          coverage_notes: profile.coverage_notes ?? '',
          admin_notes: profile.admin_notes ?? '',
          must_change_password: profile.must_change_password,
          is_active: profile.is_active,
          deactivation_reason: profile.deactivation_reason ?? '',
          password: '',
        })
        setLoading(false)
      })
  }, [mode, userId])

  useEffect(() => {
    if (usernameTouched || !form.first_name || !form.last_name) {
      return
    }

    setForm((current) => ({
      ...current,
      username: suggestUsername(form.first_name, form.last_name),
    }))
  }, [form.first_name, form.last_name, usernameTouched])

  const needsStation = STATION_REQUIRED_ROLES.includes(form.role as UserRole)
  const showPurok = form.role === 'bhw'
  const roleDetails = form.role ? ROLE_DESCRIPTIONS[form.role] : null
  const selectedHealthStationName = healthStations.find((station) => station.id === form.health_station_id)?.name ?? ''
  const displayName = formatUserDisplayName({
    first_name: form.first_name || 'New',
    middle_name: form.middle_name || null,
    last_name: form.last_name || 'User',
    name_suffix: form.name_suffix || null,
  })
  const warnings = getProfileWarnings({
    role: (form.role || 'system_admin') as UserRole,
    health_station_id: form.health_station_id || null,
    purok_assignment: form.purok_assignment || null,
    is_active: form.is_active,
    must_change_password: form.must_change_password,
    mobile_number: form.mobile_number || null,
  })

  const setFormValue = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handlePhotoSelection = (file: File | null) => {
    if (!file) {
      setSelectedPhotoFile(null)
      setPhotoError(null)
      return
    }

    if (!PROFILE_PHOTO_ACCEPTED_TYPES.includes(file.type)) {
      setSelectedPhotoFile(null)
      setPhotoError('Profile photo must be a JPG, PNG, or WEBP image.')
      return
    }

    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      setSelectedPhotoFile(null)
      setPhotoError('Profile photo must be 2 MB or smaller.')
      return
    }

    setSelectedPhotoFile(file)
    setRemovePhoto(false)
    setPhotoError(null)
  }

  const validateForm = () => {
    const nextErrors: Record<string, string> = {}

    if (!form.first_name.trim()) nextErrors.first_name = 'First name is required.'
    if (!form.last_name.trim()) nextErrors.last_name = 'Last name is required.'
    if (!form.email.trim()) nextErrors.email = 'Official email is required.'
    if (!form.username.trim()) nextErrors.username = 'Username is required.'
    if (!form.date_of_birth) nextErrors.date_of_birth = 'Date of birth is required.'
    if (!form.sex) nextErrors.sex = 'Sex is required.'
    if (!form.role) nextErrors.role = 'Role is required.'

    if (form.mobile_number && !MOBILE_NUMBER_PATTERN.test(form.mobile_number)) {
      nextErrors.mobile_number = 'Use +639XXXXXXXXX format.'
    }

    if (form.alternate_mobile_number && !MOBILE_NUMBER_PATTERN.test(form.alternate_mobile_number)) {
      nextErrors.alternate_mobile_number = 'Use +639XXXXXXXXX format.'
    }

    if (mode === 'create' && form.password.length < 12) {
      nextErrors.password = 'Initial password must be at least 12 characters.'
    }

    if (needsStation && !form.health_station_id) {
      nextErrors.health_station_id = 'BHS assignment is required for BHW and Midwife accounts.'
    }

    if (!form.is_active && !form.deactivation_reason.trim()) {
      nextErrors.deactivation_reason = 'Deactivation reason is required when the account is inactive.'
    }

    if (mode === 'edit' && form.user_id && !USER_ID_PATTERN.test(form.user_id)) {
      nextErrors.user_id = 'User ID must follow the USR-YYYY-#### format.'
    }

    return nextErrors
  }

  const uploadPhoto = async (targetUserId: string) => {
    if (!selectedPhotoFile) {
      return undefined
    }

    const nextPhotoPath = buildUserPhotoPath(targetUserId, selectedPhotoFile.name)
    const { error } = await supabase.storage
      .from(USER_PROFILE_PHOTO_BUCKET)
      .upload(nextPhotoPath, selectedPhotoFile, {
        upsert: true,
        contentType: selectedPhotoFile.type,
      })

    if (error) {
      throw new Error(error.message)
    }

    return nextPhotoPath
  }

  const removeOldPhoto = async (photoPath: string | null, nextPhotoPath?: string | null) => {
    if (!photoPath || photoPath === nextPhotoPath) {
      return
    }

    await supabase.storage.from(USER_PROFILE_PHOTO_BUCKET).remove([photoPath])
  }

  const syncPhotoPath = async (targetUserId: string, headers: Record<string, string>) => {
    const nextPhotoPath = removePhoto ? null : await uploadPhoto(targetUserId)

    if (!removePhoto && !nextPhotoPath) {
      return
    }

    const { data, error } = await supabase.functions.invoke('update-user', {
      body: {
        id: targetUserId,
        profile_photo_path: nextPhotoPath ?? null,
      },
      headers,
    })

    if (error || data?.error) {
      throw new Error(data?.error ?? error?.message ?? 'Failed to save the profile photo.')
    }

    await removeOldPhoto(currentPhotoPath, nextPhotoPath ?? null)
    const updatedProfile = data.data as UserProfile
    setCurrentUser(updatedProfile)
    setCurrentPhotoPath(updatedProfile.profile_photo_path)
    setSelectedPhotoFile(null)
    setRemovePhoto(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    setPhotoError(null)

    const nextErrors = validateForm()
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSaving(true)

    try {
      const headers = await getSupabaseFunctionHeaders()

      if (mode === 'create') {
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            first_name: form.first_name.trim(),
            middle_name: form.middle_name.trim() || null,
            last_name: form.last_name.trim(),
            name_suffix: form.name_suffix.trim() || null,
            email: form.email.trim(),
            username: form.username.trim(),
            date_of_birth: form.date_of_birth,
            sex: form.sex,
            mobile_number: form.mobile_number.trim() || null,
            alternate_mobile_number: form.alternate_mobile_number.trim() || null,
            role: form.role,
            health_station_id: needsStation ? form.health_station_id : null,
            purok_assignment: showPurok ? form.purok_assignment.trim() || null : null,
            coverage_notes: form.coverage_notes.trim() || null,
            admin_notes: form.admin_notes.trim() || null,
            password: form.password,
          },
          headers,
        })

        if (error) {
          throw error
        }

        if (data?.error) {
          throw new Error(getApiErrorMessage(data.error, 'Failed to create user.'))
        }

        const createdProfile = data.data as UserProfile
        if (selectedPhotoFile) {
          try {
            await syncPhotoPath(createdProfile.id, headers)
          } catch (photoSyncError) {
            toast.error(
              await getSupabaseFunctionErrorMessage(
                photoSyncError,
                'User was created, but the profile photo could not be saved.',
              ),
            )
          }
        }

        toast.success('User created.')
        navigate({ to: `/admin/users/${createdProfile.id}/edit` })
        return
      }

      const { data, error } = await supabase.functions.invoke('update-user', {
        body: {
          id: userId,
          user_id: form.user_id,
          first_name: form.first_name.trim(),
          middle_name: form.middle_name.trim() || null,
          last_name: form.last_name.trim(),
          name_suffix: form.name_suffix.trim() || null,
          email: form.email.trim(),
          username: form.username.trim(),
          date_of_birth: form.date_of_birth,
          sex: form.sex,
          mobile_number: form.mobile_number.trim() || null,
          alternate_mobile_number: form.alternate_mobile_number.trim() || null,
          role: form.role,
          health_station_id: needsStation ? form.health_station_id : null,
          purok_assignment: showPurok ? form.purok_assignment.trim() || null : null,
          coverage_notes: form.coverage_notes.trim() || null,
          admin_notes: form.admin_notes.trim() || null,
          must_change_password: form.must_change_password,
          is_active: form.is_active,
          deactivation_reason: form.is_active ? null : form.deactivation_reason.trim(),
        },
        headers,
      })

      if (error) {
        throw error
      }

      if (data?.error) {
        throw new Error(getApiErrorMessage(data.error, 'Failed to save user changes.'))
      }

      const updatedProfile = data.data as UserProfile
      setCurrentUser(updatedProfile)
      setCurrentPhotoPath(updatedProfile.profile_photo_path)
      setForm((current) => ({
        ...current,
        user_id: updatedProfile.user_id,
        email: updatedProfile.email,
        must_change_password: updatedProfile.must_change_password,
        is_active: updatedProfile.is_active,
        deactivation_reason: updatedProfile.deactivation_reason ?? '',
      }))

      if (selectedPhotoFile || removePhoto) {
        await syncPhotoPath(updatedProfile.id, headers)
      }

      toast.success('User changes saved.')
    } catch (caughtError) {
      setSubmitError(
        await getSupabaseFunctionErrorMessage(
          caughtError,
          mode === 'create' ? 'Failed to create user.' : 'Failed to save user changes.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <Card>
          <CardContent className="py-12 text-sm text-muted-foreground">Loading user profile...</CardContent>
        </Card>
        <Card>
          <CardContent className="py-12 text-sm text-muted-foreground">Preparing account summary...</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_360px] xl:items-start">
        <div className="flex flex-col gap-6">
          {submitError ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Could not save this account</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          {warnings.length > 0 ? (
            <Alert>
              <Info />
              <AlertTitle>Configuration reminders</AlertTitle>
              <AlertDescription>
                <ul className="ml-4 list-disc">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <SectionCard
            title="Identity"
            description="Use normalized name fields so staff records stay searchable and consistent."
          >
            <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field data-invalid={fieldErrors.first_name ? true : undefined}>
                <FieldLabel htmlFor="first-name">First name</FieldLabel>
                <Input
                  id="first-name"
                  value={form.first_name}
                  onChange={(event) => setFormValue('first_name', event.target.value)}
                  placeholder="Juana"
                  aria-invalid={fieldErrors.first_name ? true : undefined}
                />
                <FieldError>{fieldErrors.first_name}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="middle-name">Middle name</FieldLabel>
                <Input
                  id="middle-name"
                  value={form.middle_name}
                  onChange={(event) => setFormValue('middle_name', event.target.value)}
                  placeholder="Santos"
                />
                <FieldDescription>Optional.</FieldDescription>
              </Field>

              <Field data-invalid={fieldErrors.last_name ? true : undefined}>
                <FieldLabel htmlFor="last-name">Last name</FieldLabel>
                <Input
                  id="last-name"
                  value={form.last_name}
                  onChange={(event) => setFormValue('last_name', event.target.value)}
                  placeholder="Dela Cruz"
                  aria-invalid={fieldErrors.last_name ? true : undefined}
                />
                <FieldError>{fieldErrors.last_name}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="name-suffix">Name suffix</FieldLabel>
                <Input
                  id="name-suffix"
                  value={form.name_suffix}
                  onChange={(event) => setFormValue('name_suffix', event.target.value)}
                  placeholder="Jr., Sr., III"
                />
                <FieldDescription>Optional.</FieldDescription>
              </Field>

              <Field data-invalid={fieldErrors.date_of_birth ? true : undefined}>
                <FieldLabel htmlFor="date-of-birth">Date of birth</FieldLabel>
                <DatePicker
                  id="date-of-birth"
                  value={form.date_of_birth}
                  onChange={(value) => setFormValue('date_of_birth', value)}
                  placeholder="Select date of birth"
                />
                <FieldError>{fieldErrors.date_of_birth}</FieldError>
              </Field>

              <Field data-invalid={fieldErrors.sex ? true : undefined}>
                <FieldLabel htmlFor="sex">Sex</FieldLabel>
                <Select value={form.sex} onValueChange={(value) => setFormValue('sex', value as 'M' | 'F')}>
                  <SelectTrigger id="sex" aria-invalid={fieldErrors.sex ? true : undefined}>
                    <SelectValue placeholder="Select sex">
                      {(value: string | null) => {
                        if (value === 'M') return 'Male'
                        if (value === 'F') return 'Female'
                        return 'Select sex'
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError>{fieldErrors.sex}</FieldError>
              </Field>
            </FieldGroup>
          </SectionCard>

          <SectionCard
            title="Contact"
            description="Email stays aligned with the auth login. Mobile numbers should use Philippine format."
          >
            <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field data-invalid={fieldErrors.email ? true : undefined}>
                <FieldLabel htmlFor="email">Official email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setFormValue('email', event.target.value)}
                  placeholder="juana.delacruz@cho2.gov.ph"
                  aria-invalid={fieldErrors.email ? true : undefined}
                />
                <FieldDescription>Used for sign-in and admin alerts.</FieldDescription>
                <FieldError>{fieldErrors.email}</FieldError>
              </Field>

              <Field data-invalid={fieldErrors.mobile_number ? true : undefined}>
                <FieldLabel htmlFor="mobile-number">Mobile number</FieldLabel>
                <Input
                  id="mobile-number"
                  value={form.mobile_number}
                  onChange={(event) => setFormValue('mobile_number', event.target.value)}
                  placeholder="+639171234567"
                  aria-invalid={fieldErrors.mobile_number ? true : undefined}
                />
                <FieldDescription>Recommended for field roles.</FieldDescription>
                <FieldError>{fieldErrors.mobile_number}</FieldError>
              </Field>

              <Field data-invalid={fieldErrors.alternate_mobile_number ? true : undefined}>
                <FieldLabel htmlFor="alternate-mobile-number">Alternate mobile number</FieldLabel>
                <Input
                  id="alternate-mobile-number"
                  value={form.alternate_mobile_number}
                  onChange={(event) => setFormValue('alternate_mobile_number', event.target.value)}
                  placeholder="+639171234567"
                  aria-invalid={fieldErrors.alternate_mobile_number ? true : undefined}
                />
                <FieldDescription>Optional backup contact.</FieldDescription>
                <FieldError>{fieldErrors.alternate_mobile_number}</FieldError>
              </Field>
            </FieldGroup>
          </SectionCard>

          <SectionCard
            title="Role and access"
            description="Role drives app access and whether the account should be city-wide or station-scoped."
          >
            <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field data-invalid={fieldErrors.user_id ? true : undefined}>
                <FieldLabel htmlFor="user-id">User ID</FieldLabel>
                <Input
                  id="user-id"
                  value={form.user_id}
                  readOnly
                  disabled
                  aria-invalid={fieldErrors.user_id ? true : undefined}
                  placeholder="Generated automatically after account creation"
                />
                <FieldDescription>
                  {mode === 'create' ? 'Generated automatically after the account is created.' : 'Readable staff identifier. Format: USR-YYYY-####.'}
                </FieldDescription>
                <FieldError>{fieldErrors.user_id}</FieldError>
              </Field>

              <Field data-invalid={fieldErrors.username ? true : undefined}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(event) => {
                    setUsernameTouched(true)
                    setFormValue('username', event.target.value)
                  }}
                  placeholder="e.g. a.delacruz"
                  aria-invalid={fieldErrors.username ? true : undefined}
                />
                <FieldDescription>Suggested from first and last name, but editable.</FieldDescription>
                <FieldError>{fieldErrors.username}</FieldError>
              </Field>

              <Field data-invalid={fieldErrors.role ? true : undefined}>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select
                  value={form.role}
                  onValueChange={(value) => {
                    const nextRole = value as UserRole
                    setForm((current) => ({
                      ...current,
                      role: nextRole,
                      health_station_id: STATION_REQUIRED_ROLES.includes(nextRole) ? current.health_station_id : '',
                      purok_assignment: nextRole === 'bhw' ? current.purok_assignment : '',
                    }))
                  }}
                >
                  <SelectTrigger id="role" aria-invalid={fieldErrors.role ? true : undefined}>
                    <SelectValue placeholder="Select a role">
                      {(value: string | null) => (value ? getRoleLabel(value as UserRole) : 'Select a role')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {getRoleLabel(role)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError>{fieldErrors.role}</FieldError>
              </Field>

              {mode === 'create' ? (
                <Field data-invalid={fieldErrors.password ? true : undefined}>
                  <FieldLabel htmlFor="initial-password">Initial password</FieldLabel>
                  <Input
                    id="initial-password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setFormValue('password', event.target.value)}
                    placeholder="Minimum 12 characters"
                    aria-invalid={fieldErrors.password ? true : undefined}
                  />
                  <FieldDescription>The user can skip the reminder dialog, but the pending flag stays visible to admins.</FieldDescription>
                  <FieldError>{fieldErrors.password}</FieldError>
                </Field>
              ) : (
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="must-change-password">Password reminder</FieldLabel>
                  <Switch
                    id="must-change-password"
                    checked={form.must_change_password}
                    onCheckedChange={(checked) => setFormValue('must_change_password', checked)}
                  />
                </Field>
              )}

              {mode === 'edit' ? (
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="account-active">Account active</FieldLabel>
                  <Switch
                    id="account-active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setFormValue('is_active', checked)}
                  />
                </Field>
              ) : null}

              {mode === 'edit' && !form.is_active ? (
                <Field className="md:col-span-2" data-invalid={fieldErrors.deactivation_reason ? true : undefined}>
                  <FieldLabel htmlFor="deactivation-reason">Deactivation reason</FieldLabel>
                  <Textarea
                    id="deactivation-reason"
                    value={form.deactivation_reason}
                    onChange={(event) => setFormValue('deactivation_reason', event.target.value)}
                    placeholder="Why is this account inactive?"
                    aria-invalid={fieldErrors.deactivation_reason ? true : undefined}
                  />
                  <FieldError>{fieldErrors.deactivation_reason}</FieldError>
                </Field>
              ) : null}
            </FieldGroup>
          </SectionCard>

          <SectionCard
            title="Assignment and coverage"
            description={form.role && CITY_WIDE_ROLES.includes(form.role as UserRole)
              ? 'This role is city-wide. Station fields are shown only when the role needs them.'
              : 'Scope the account carefully so barangay-level roles only see the right records.'}
          >
            <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field data-invalid={fieldErrors.health_station_id ? true : undefined}>
                <FieldLabel htmlFor="health-station">BHS assignment</FieldLabel>
                <HealthStationCombobox
                  id="health-station"
                  ariaInvalid={fieldErrors.health_station_id ? true : undefined}
                  disabled={!needsStation}
                  value={form.health_station_id}
                  stations={healthStations}
                  onChange={(value) => setFormValue('health_station_id', value)}
                />
                <FieldError>{fieldErrors.health_station_id}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="purok-assignment">Purok assignment</FieldLabel>
                <Input
                  id="purok-assignment"
                  value={form.purok_assignment}
                  onChange={(event) => setFormValue('purok_assignment', event.target.value)}
                  placeholder={showPurok ? 'Example: Purok 3' : 'Not used for this role'}
                  disabled={!showPurok}
                />
                <FieldDescription>{showPurok ? 'Recommended for BHW routing and local accountability.' : 'Visible only for BHW accounts.'}</FieldDescription>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="coverage-notes">Coverage notes</FieldLabel>
                <Textarea
                  id="coverage-notes"
                  value={form.coverage_notes}
                  onChange={(event) => setFormValue('coverage_notes', event.target.value)}
                  placeholder="Example: Handles puroks 1 to 3 during outreach days."
                />
                <FieldDescription>Operational notes visible to authorized supervisors and admins.</FieldDescription>
              </Field>
            </FieldGroup>
          </SectionCard>

          <SectionCard
            title="Admin notes"
            description="Private notes for system administrators only."
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="admin-notes">Internal notes</FieldLabel>
                <Textarea
                  id="admin-notes"
                  value={form.admin_notes}
                  onChange={(event) => setFormValue('admin_notes', event.target.value)}
                  placeholder="Example: Uses shared station laptop on Tuesdays; verify mobile number next onboarding review."
                />
              </Field>
            </FieldGroup>
          </SectionCard>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? 'Saving...' : mode === 'create' ? 'Create user' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate({ to: '/admin/users', search: DEFAULT_ADMIN_USERS_SEARCH })}
              disabled={saving}
            >
              Back to users
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-6 xl:sticky xl:top-24">
          <Card>
            <CardHeader>
              <CardTitle>Profile photo</CardTitle>
              <CardDescription>Optional, but helpful for recognition and safer account selection.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {photoError ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Photo not ready</AlertTitle>
                  <AlertDescription>{photoError}</AlertDescription>
                </Alert>
              ) : null}
              <div className="flex items-center gap-4">
                <UserAvatar
                  firstName={form.first_name || 'N'}
                  lastName={form.last_name || 'U'}
                  photoPath={removePhoto ? null : currentPhotoPath}
                  src={photoPreviewUrl}
                  size="lg"
                />
                <div className="flex flex-col gap-2">
                  <input
                    ref={photoInputRef}
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      handlePhotoSelection(event.target.files?.[0] ?? null)
                      event.currentTarget.value = ''
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Upload data-icon="inline-start" />
                    {selectedPhotoFile || currentPhotoPath ? 'Replace photo' : 'Upload photo'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setSelectedPhotoFile(null)
                      setRemovePhoto(true)
                      setPhotoError(null)
                    }}
                    disabled={!currentPhotoPath && !selectedPhotoFile}
                  >
                    <ImagePlus data-icon="inline-start" />
                    Remove photo
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Private storage, max 2 MB, JPG/PNG/WEBP only. Initials stay visible whenever no photo is set.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Account summary</CardTitle>
              <CardDescription>{displayName}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <SidebarDatum label="Role" value={form.role ? getRoleLabel(form.role) : 'Choose a role'} />
              <SidebarDatum label="User ID" value={form.user_id || 'Generated after create'} />
              <SidebarDatum label="Username" value={form.username || 'Will be used in audit logs'} />
              <SidebarDatum
                label="Scope"
                value={needsStation
                  ? selectedHealthStationName || 'Choose a health station'
                  : 'City-wide'}
              />
              <SidebarDatum
                label="Password state"
                value={form.must_change_password ? 'Reminder active' : 'Reminder cleared'}
              />
              <SidebarDatum label="Account status" value={form.is_active ? 'Active' : 'Inactive'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role access</CardTitle>
              <CardDescription>
                {roleDetails?.description ?? 'Select a role to preview its operational footprint.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              {roleDetails ? roleDetails.access.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 text-primary" />
                  <span>{item}</span>
                </div>
              )) : (
                <p>Role-specific access notes will appear here once a role is selected.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account activity</CardTitle>
              <CardDescription>Useful for auditing and admin follow-up.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <SidebarDatum label="Created" value={formatDateTime(currentUser?.created_at ?? null)} />
              <SidebarDatum label="Last updated" value={formatDateTime(currentUser?.updated_at ?? null)} />
              <SidebarDatum label="Last login" value={formatDateTime(currentUser?.last_login_at ?? null)} />
              <SidebarDatum label="Password changed" value={formatDateTime(currentUser?.password_changed_at ?? null)} />
              {!form.is_active ? (
                <SidebarDatum label="Inactive reason" value={form.deactivation_reason || 'Not recorded'} />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function SidebarDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function HealthStationCombobox({
  id,
  ariaInvalid,
  disabled,
  value,
  stations,
  onChange,
}: {
  id: string
  ariaInvalid?: boolean
  disabled: boolean
  value: string
  stations: HealthStation[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const normalizedSearch = search.trim().toLowerCase()
  const selectedStation = stations.find((station) => station.id === value) ?? null
  const filteredStations = normalizedSearch
    ? stations.filter((station) => station.name.toLowerCase().includes(normalizedSearch))
    : stations

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setSearch('')
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            disabled={disabled}
            className="w-full justify-between gap-2 px-2.5 font-normal"
          />
        }
      >
        <span
          title={selectedStation?.name ?? undefined}
          className={selectedStation
            ? 'min-w-0 flex-1 truncate text-left'
            : 'min-w-0 flex-1 truncate text-left text-muted-foreground'}
        >
          {disabled
            ? 'Not required for this role'
            : selectedStation?.name ?? 'Select a health station'}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(32rem,calc(100vw-2rem))] min-w-[18rem] p-0"
      >
        <Command shouldFilter={false} className="rounded-lg">
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search health station"
          />
          <CommandList className="max-h-72 [scrollbar-width:thin] [scrollbar-color:var(--color-border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
            <CommandEmpty>No health station found.</CommandEmpty>
            <CommandGroup>
              {filteredStations.map((station) => (
                <CommandItem
                  key={station.id}
                  value={station.id}
                  onSelect={() => {
                    onChange(station.id)
                    setOpen(false)
                  }}
                  showIndicator={false}
                  className="items-start gap-3 py-2.5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Check
                      className={value === station.id ? 'mt-0.5 size-4 shrink-0 opacity-100' : 'mt-0.5 size-4 shrink-0 opacity-0'}
                    />
                    <span className="whitespace-normal break-words leading-5">
                      {station.name}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function suggestUsername(firstName: string, lastName: string) {
  const normalizedFirstName = firstName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
  const normalizedLastName = lastName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')

  if (!normalizedFirstName || !normalizedLastName) {
    return ''
  }

  return `${normalizedFirstName.charAt(0)}.${normalizedLastName}`
}
