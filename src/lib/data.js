export async function getUserRole(supabase, userId) {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()
  return data?.role || 'viewer'
}

export async function fetchMeals(supabase) {
  const { data } = await supabase
    .from('meals')
    .select('*')
    .order('category')
  return data || []
}

export async function fetchAllWeeklyPlans(supabase) {
  const { data } = await supabase
    .from('weekly_plans')
    .select('*')
  return data || []
}
