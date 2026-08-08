import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'
import { getUserRole, fetchMeals } from '../lib/data'
import HomeClient from './components/HomeClient'

export default async function Home() {
  const supabase = await createClient()

  // 1. Get the session securely on server
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    redirect('/auth/login')
  }

  // 2. Fetch role and meals natively on server
  const [userRole, meals] = await Promise.all([
    getUserRole(supabase, session.user.id),
    fetchMeals(supabase),
  ])

  return (
    <HomeClient
      initialMeals={meals}
      user={session.user}
      userRole={userRole}
    />
  )
}