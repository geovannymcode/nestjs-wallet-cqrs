export interface ComplianceCheckResult {
  isClean: boolean;
  reason?: string;
}

export interface ComplianceService {
  checkAccount(account: string): Promise<ComplianceCheckResult>;
}