import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'
import HomeClient from './components/HomeClient'
import { globalStyles } from './styles/stitchTheme'

export default async function Home() {
  const supabase = await createClient()

  // 1. Get the session securely on server
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    redirect('/auth/login')
  }

  // 2. Fetch User Role securely
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single()

  const userRole = roleData?.role || 'viewer'

  // 3. Fetch Meals natively on server
  const { data: meals } = await supabase
    .from('meals')
    .select('*')
    .order('category')

  return (
    <>
      <style>{globalStyles}</style>
      <HomeClient
        initialMeals={meals || []}
        user={session.user}
        userRole={userRole}
      />
    </>
  )
}