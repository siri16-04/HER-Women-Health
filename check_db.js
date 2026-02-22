const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://zpsflttnwxxirgkglakv.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwc2ZsdHRud3h4aXJna2dsYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzEzMjgsImV4cCI6MjA4Njc0NzMyOH0._IIr3m46e2oYwUO_Fy0ZWjzbBZeHpY1uVmokrXOcQag'
)

async function test() {
    const { data, error } = await supabase
        .from('sessions')
        .select(`
      id, created_at,
      diagnosis_results (*),
      biometric_summaries (*)
    `)
        .order('created_at', { ascending: false })
        .limit(3)

    if (error) {
        console.error('Error fetching:', error)
    } else {
        console.log(JSON.stringify(data, null, 2))
    }
}
test()
