import { getAdminSession } from '@/lib/admin-auth'
import { getUserSession } from '@/lib/user-auth'
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
 * If the visitor has a valid admin session cookie or is logged in with
 * a special ADMIN user account, render the dashboard.
 * Otherwise, render the admin login form.
 * No link to /admin exists anywhere in the public app for regular users.
 */
export default async function AdminPage() {
  const session = await getAdminSession()
  if (session) {
    return <AdminDashboard adminEmail={session.email} />
  }

  const user = await getUserSession()
  if (user && user.role === 'ADMIN') {
    return <AdminDashboard adminEmail={user.email} />
  }

  return <AdminLoginForm />
}
