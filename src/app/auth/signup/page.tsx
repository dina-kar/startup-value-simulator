'use client'

import { AuthForm } from '@/components/auth/AuthForm'
import { NotificationProvider, useAutoRemoveNotifications } from '@/components/ui/notification-provider'

export default function SignupPage() {
  useAutoRemoveNotifications()

  return (
    <>
      <AuthForm mode="signup" />
      <NotificationProvider />
    </>
  )
}
