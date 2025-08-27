'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banner, BannerIcon, BannerTitle } from '@/components/ui/banner'
import { useAuth } from '@/lib/auth/AuthContext'
import { useNotifications } from '@/lib/stores/uiStore'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const { signIn, signUp, resetPassword } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)

  const isLogin = mode === 'login'
  const title = isLogin ? 'Sign In' : 'Create Account'
  const submitText = isLogin ? 'Sign In' : 'Create Account'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          showError('Sign In Failed', error.message)
        } else {
          showSuccess('Welcome back!', 'You have been signed in successfully.')
          router.push('/builder')
        }
      } else {
        // Validation for signup
        if (formData.password !== formData.confirmPassword) {
          showError('Password Mismatch', 'Passwords do not match.')
          setLoading(false)
          return
        }

        if (formData.password.length < 6) {
          showError('Password Too Short', 'Password must be at least 6 characters long.')
          setLoading(false)
          return
        }

        const { error } = await signUp(formData.email, formData.password, {
          fullName: formData.fullName
        })

        if (error) {
          showError('Sign Up Failed', error.message)
        } else {
          showSuccess(
            'Account Created!', 
            'Please check your email to verify your account before signing in.'
          )
          router.push('/auth/login')
        }
      }
    } catch (err) {
      console.error('Authentication error:', err)
      showError('Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!formData.email) {
      showError('Email Required', 'Please enter your email address.')
      return
    }

    setLoading(true)
    try {
      const { error } = await resetPassword(formData.email)
      if (error) {
        showError('Reset Failed', error.message)
      } else {
        showSuccess(
          'Reset Email Sent',
          'Check your email for password reset instructions.'
        )
        setShowResetPassword(false)
      }
    } catch (err) {
      console.error('Password reset error:', err)
      showError('Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin 
              ? 'Welcome back to Startup Value Simulator'
              : 'Get started with your cap table modeling'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative mt-1">
                <UserIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  className="pl-10"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <MailIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <LockIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-1">
                <LockIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              submitText
            )}
          </Button>
        </form>

        {isLogin && !showResetPassword && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              className="text-sm text-primary hover:underline"
            >
              Forgot your password?
            </button>
          </div>
        )}

        {showResetPassword && (
          <Banner className="bg-blue-50 text-blue-900 border-blue-200">
            <BannerIcon icon={MailIcon} />
            <div className="flex-1">
              <BannerTitle className="font-semibold">
                Reset Password
              </BannerTitle>
              <p className="text-sm mt-1">
                Enter your email above and click the button below to receive reset instructions.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleResetPassword}
                  disabled={loading}
                  size="sm"
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </Button>
                <Button
                  onClick={() => setShowResetPassword(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Banner>
        )}

        <div className="text-center text-sm text-muted-foreground">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
