import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatInitials, USER_PROFILE_PHOTO_BUCKET } from '@/lib/user-profiles'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserAvatarProps {
  firstName: string
  lastName: string
  photoPath?: string | null
  src?: string | null
  size?: 'sm' | 'default' | 'lg'
}

export function UserAvatar({ firstName, lastName, photoPath, src, size = 'default' }: UserAvatarProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadSignedUrl = async () => {
      if (src || !photoPath) {
        setSignedUrl(null)
        return
      }

      const { data, error } = await supabase.storage
        .from(USER_PROFILE_PHOTO_BUCKET)
        .createSignedUrl(photoPath, 60 * 60)

      if (!active) return

      if (error || !data?.signedUrl) {
        setSignedUrl(null)
        return
      }

      setSignedUrl(data.signedUrl)
    }

    void loadSignedUrl()

    return () => {
      active = false
    }
  }, [photoPath, src])

  const imageSource = src ?? signedUrl

  return (
    <Avatar size={size}>
      {imageSource ? <AvatarImage src={imageSource} alt={`${firstName} ${lastName}`} /> : null}
      <AvatarFallback>{formatInitials(firstName, lastName)}</AvatarFallback>
    </Avatar>
  )
}
