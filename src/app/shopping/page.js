import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { getUserRole, fetchMeals, fetchAllWeeklyPlans } from '../../lib/data'
import ShoppingClient from '../components/ShoppingClient'

export default async function ShoppingPage() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/auth/login')
  }

  const [userRole, meals, plans] = await Promise.all([
    getUserRole(supabase, session.user.id),
    fetchMeals(supabase),
    fetchAllWeeklyPlans(supabase),
  ])

  return (
    <ShoppingClient
      user={session.user}
      userRole={userRole}
      initialMeals={meals}
      initialPlans={plans}
    />
  )
}
