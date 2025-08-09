export function formatWithUnit(value?: number, unit?: string, options: { decimals?: number } = {}): string {
  if (value === undefined || value === null) return 'N/A'
  const { decimals } = options
  const formatted = typeof decimals === 'number'
    ? value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : value.toLocaleString()
  return unit ? `${formatted} ${unit}` : formatted
}

export function getDefaultUnitForNetwork(network: 'oil' | 'domesticGas' | 'exportGas' | 'flaredGas'): string {
  if (network === 'oil') return 'bbl/d'
  return 'mcf/d'
}

export function formatNetworkMetric(value?: number, network?: 'oil' | 'domesticGas' | 'exportGas' | 'flaredGas', providedUnit?: string) {
  const unit = providedUnit || (network ? getDefaultUnitForNetwork(network) : undefined)
  return formatWithUnit(value, unit)
} 