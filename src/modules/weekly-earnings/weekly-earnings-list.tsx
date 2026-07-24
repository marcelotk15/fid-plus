import { Accordion } from '~/modules/shared/react/components/accordion'
import { cn } from '~/modules/shared/react/utils/cn'

import type { WeeklyObjectiveStatus } from './weekly-objectives.types'

import { formatMoney } from './format-currency'
import { useWeeklyEarnings } from './use-weekly-earnings'
import { formatWeekRangeFromStart, formatWeekRangeLabel, getWeekRange } from './week-range'
import { buildWeeklyMilestoneViews } from './weekly-milestones'

function getErrorMessage(error: NonNullable<ReturnType<typeof useWeeklyEarnings>['error']>): string {
  switch (error) {
    case 'no_token':
      return 'Sessão inválida. Faça login novamente no FID.'
    case 'profile_not_found':
      return 'Perfil não encontrado.'
    case 'no_player_profile':
      return 'Nenhum jogador ativo vinculado a esta conta.'
    case 'not_found':
      return 'Nenhum contrato encontrado para este jogador.'
    case 'http':
      return 'Não foi possível carregar os ganhos da semana.'
    case 'parse':
      return 'Resposta inválida ao carregar os ganhos da semana.'
    case 'network':
      return 'Erro de rede ao carregar os ganhos da semana.'
  }
}

function getObjectivesErrorMessage(
  error: NonNullable<NonNullable<ReturnType<typeof useWeeklyEarnings>['earnings']>['objectivesError']>,
): string {
  switch (error) {
    case 'http':
      return 'Não foi possível carregar os objetivos semanais.'
    case 'parse':
      return 'Resposta inválida dos objetivos semanais.'
    case 'network':
      return 'Erro de rede ao carregar os objetivos semanais.'
  }
}

type EarningsRowProps = {
  label: string
  value: string
  status?: WeeklyObjectiveStatus
  progress?: string
  isLastBeforeFooter?: boolean
}

function PendingStatusIcon() {
  return (
    <svg className="mt-0.5 size-[13px] shrink-0 animate-spin text-gray-400" viewBox="0 0 16 16" aria-hidden>
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="18 20"
      />
    </svg>
  )
}

function EarningsRow({ label, value, status, progress, isLastBeforeFooter }: EarningsRowProps) {
  const isCompleted = status === 'completed'
  const isUnreachable = status === 'unreachable'

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 py-2 border-b border-black/10',
        isLastBeforeFooter ? 'border-b-0' : 'last:border-b-0',
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        {status ? (
          isCompleted ? (
            <span className="mt-0.5 shrink-0 text-[13px] leading-none text-primary-900" aria-hidden>
              ✓
            </span>
          ) : isUnreachable ? (
            <span className="mt-0.5 shrink-0 text-[13px] leading-none text-red-500" aria-hidden>
              ✗
            </span>
          ) : (
            <PendingStatusIcon />
          )
        ) : null}
        <div className="min-w-0">
          <span
            className={cn(
              'block text-[13px]',
              isCompleted && 'text-gray-400 line-through',
              isUnreachable && 'text-gray-400',
            )}
          >
            {label}
          </span>
          {isUnreachable ? (
            <span className="block text-[11px] text-red-500">Perdido</span>
          ) : progress ? (
            <span className="block text-[11px] text-gray-400">{progress}</span>
          ) : null}
        </div>
      </div>
      <span className="shrink-0 text-[13px] font-bold tabular-nums">{value}</span>
    </div>
  )
}

export function WeeklyEarningsList() {
  const { earnings, loading, error } = useWeeklyEarnings()
  const weekLabel = earnings?.weekStart
    ? formatWeekRangeFromStart(earnings.weekStart)
    : formatWeekRangeLabel(getWeekRange())
  const milestoneViews = earnings ? buildWeeklyMilestoneViews(earnings.milestones) : []
  const showMarcos = Boolean(earnings && !earnings.objectivesError)

  return (
    <div data-testid="weekly-earnings-list" className="flex flex-col gap-3">
      <h2 className="m-0 text-sm font-semibold ">{weekLabel}</h2>

      {loading ? (
        <p className="m-0 text-[13px]">Carregando ganhos da semana...</p>
      ) : error ? (
        <p className="m-0 text-[13px]">{getErrorMessage(error)}</p>
      ) : earnings ? (
        <div className="flex flex-col gap-1">
          <Accordion title="Fixos">
            <EarningsRow label="Salário" value={formatMoney(earnings.salary)} />
            <EarningsRow label="Patrocínio" value={formatMoney(earnings.sponsorship)} />
            {earnings.salaryBonus ? (
              <EarningsRow
                label={earnings.salaryBonus.label}
                value={earnings.salaryBonus.value}
                status={earnings.salaryBonus.status}
              />
            ) : null}
          </Accordion>

          <Accordion title="Objetivos semanais" className={showMarcos ? undefined : 'border-b-0'}>
            {earnings.objectivesError ? (
              <p className="m-0 py-2 text-[13px]">{getObjectivesErrorMessage(earnings.objectivesError)}</p>
            ) : (
              earnings.objectives.map((objective, index, objectives) => (
                <EarningsRow
                  key={objective.key}
                  label={objective.label}
                  value={formatMoney(objective.rewardMoney)}
                  status={objective.status}
                  progress={
                    objective.status === 'in_progress'
                      ? `${objective.currentCount}/${objective.targetCount}`
                      : undefined
                  }
                  isLastBeforeFooter={!showMarcos && index === objectives.length - 1}
                />
              ))
            )}
          </Accordion>

          {!earnings.objectivesError ? (
            <Accordion title="Marcos" className="border-b-0">
              {milestoneViews.map((milestone, index) => (
                <EarningsRow
                  key={milestone.key}
                  label={milestone.label}
                  value={formatMoney(milestone.rewardMoney)}
                  status={milestone.isCompleted ? 'completed' : 'in_progress'}
                  progress={
                    milestone.isCompleted ? undefined : `${earnings.milestones.completedCount}/${milestone.targetCount}`
                  }
                  isLastBeforeFooter={index === milestoneViews.length - 1}
                />
              ))}
            </Accordion>
          ) : null}

          <div className="flex flex-col gap-2 pt-3 border-t border-black/10">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold">Ganho</span>
              <span className="text-[13px] font-semibold tabular-nums">{formatMoney(earnings.totals.earned)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold">Potencial</span>
              <span className="text-[13px] font-semibold tabular-nums">{formatMoney(earnings.totals.potential)}</span>
            </div>
            {!earnings.objectivesError ? (
              <p className="m-0 text-[11px] leading-snug text-gray-400">
                Não considera missões ou marcos que não podem mais ser concluídos nesta semana.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
