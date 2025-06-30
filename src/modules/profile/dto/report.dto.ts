export interface ReportDto {
  reason: ReportReason;
  message: string;
}

export enum ReportReason {
  INAPPROPRIATE_CONTENT,
  FAKE_PROFILE,
  HARASSMENT,
  SPAM,
  UNDERAGE,
  OTHER,
}
