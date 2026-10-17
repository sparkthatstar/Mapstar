import { getAdminSession } from '@/lib/admin-auth'
import AdminLoginForm from '@/components/admin/admin-login-form'
import AdminDashboard from '@/components/admin/admin-dashboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mapstar Admin',
  robots: { index: false, follow: false },
}

/**
 * /admin — server component.
 *
 * If the visitor has a valid admin session cookie, render the dashboard.
 * Otherwise, render the login form. No link to /admin exists anywhere
 * in the public app — admins navigate here directly via the URL.
 */
export default async function AdminPage() {
  const session = await getAdminSession()
  if (!session) {
    return <AdminLoginForm />
  }
  return <AdminDashboard adminEmail={session.email} />
}
