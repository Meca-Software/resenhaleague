'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Status allowed: 'CONFIRMED', 'ABSENT', 'PENDING', 'AVAILABLE'

export async function updateAttendance(raceId: string, pilotId: string, status: string) {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  const adminClient = await createAdminClient()

  // Buscar dados do piloto e da corrida para aplicar as regras de negócio
  const { data: pilot } = await adminClient.from('pilots').select('*').eq('id', pilotId).single()
  const { data: race } = await adminClient.from('races').select('name, season_id').eq('id', raceId).single()

  let payload: any = {
    race_id: raceId, 
    pilot_id: pilotId, 
    status: status,
    updated_at: new Date().toISOString()
  }

  if (pilot && race) {
    // 1. Regra para Pilotos Titulares (Não Reservas)
    if (!pilot.is_reserve && pilot.current_team_id) {
      if (status === 'ABSENT') {
        // Notificar reservas
        const { data: reserves } = await adminClient
          .from('pilots')
          .select('profile_id')
          .eq('season_id', race.season_id)
          .eq('is_reserve', true)
          .not('profile_id', 'is', null)
        
        if (reserves && reserves.length > 0) {
          const notifications = reserves.map(r => ({
            user_id: r.profile_id,
            title: `Vaga Aberta: ${race.name}`,
            message: `Um piloto titular confirmou ausência. Corra para o portal e garanta sua vaga!`,
            link: `/portal/proxima-corrida`
          }))
          await adminClient.from('notifications').insert(notifications)
        }
      } else if (status === 'CONFIRMED' || status === 'PENDING') {
        // Se o titular confirmar presença novamente, precisamos verificar se precisamos remover um reserva
        const { data: absentAttendances } = await adminClient.from('race_attendances')
          .select('pilot_id')
          .eq('race_id', raceId)
          .eq('status', 'ABSENT')
          .neq('pilot_id', pilotId); // Excluir ele mesmo

        const absentPilotIds = absentAttendances?.map(a => a.pilot_id) || [];
        
        let vacantTeamIds: string[] = [];
        if (absentPilotIds.length > 0) {
          const { data: absentPilots } = await adminClient.from('pilots')
            .select('current_team_id')
            .in('id', absentPilotIds)
            .eq('is_reserve', false);
          vacantTeamIds = absentPilots?.map(p => p.current_team_id).filter(Boolean) || [];
        }

        const teamVacancies = vacantTeamIds.filter(id => id === pilot.current_team_id).length;

        // Quantos reservas estão alocados para esta equipe?
        const { data: assignedAttendances } = await adminClient.from('race_attendances')
          .select('id')
          .eq('race_id', raceId)
          .eq('status', 'AVAILABLE')
          .eq('assigned_team_id', pilot.current_team_id)
          .order('updated_at', { ascending: false }); // O último a entrar sai primeiro

        if (assignedAttendances && assignedAttendances.length > teamVacancies) {
          // Remover o último reserva
          const toRemove = assignedAttendances[0];
          await adminClient.from('race_attendances').update({ assigned_team_id: null }).eq('id', toRemove.id);
        }
      }
    }

    // 2. Regra para Pilotos Reservas
    if (pilot.is_reserve) {
      if (status === 'AVAILABLE') {
        // Checar se há vaga
        const { data: absentAttendances } = await adminClient.from('race_attendances')
          .select('pilot_id')
          .eq('race_id', raceId)
          .eq('status', 'ABSENT');

        const absentPilotIds = absentAttendances?.map(a => a.pilot_id) || [];
        let vacantTeamIds: string[] = [];
        if (absentPilotIds.length > 0) {
          const { data: absentPilots } = await adminClient.from('pilots')
            .select('current_team_id')
            .in('id', absentPilotIds)
            .eq('is_reserve', false);
          vacantTeamIds = absentPilots?.map(p => p.current_team_id).filter(Boolean) || [];
        }

        const { data: assignedAttendances } = await adminClient.from('race_attendances')
          .select('assigned_team_id')
          .eq('race_id', raceId)
          .eq('status', 'AVAILABLE')
          .not('assigned_team_id', 'is', null)
          .neq('pilot_id', pilotId); // Excluir eu mesmo se já estiver alocado

        const assignedTeamIds = assignedAttendances?.map(a => a.assigned_team_id) || [];

        const availableTeamId = vacantTeamIds.find(tid => {
          const teamVacancies = vacantTeamIds.filter(id => id === tid).length;
          const teamAssigned = assignedTeamIds.filter(id => id === tid).length;
          return teamAssigned < teamVacancies;
        });

        if (availableTeamId) {
          payload.assigned_team_id = availableTeamId;
        } else {
          payload.assigned_team_id = null; // Fila de espera
        }
      } else {
        payload.assigned_team_id = null; // Desiste da vaga
      }
    }
  }

  // Update or Insert the attendance record
  const { error } = await adminClient
    .from('race_attendances')
    .upsert(payload, { onConflict: 'race_id,pilot_id' })

  if (error) {
    console.error('Erro ao atualizar presença:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/portal/proxima-corrida')
  revalidatePath('/admin/presencas')
  revalidatePath('/')
  
  return { success: true }
}

export async function adminUpdateAttendance(raceId: string, pilotId: string, status: string) {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('race_attendances')
    .upsert(
      { 
        race_id: raceId, 
        pilot_id: pilotId, 
        status: status,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'race_id,pilot_id' }
    )

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/presencas')
  
  return { success: true }
}
