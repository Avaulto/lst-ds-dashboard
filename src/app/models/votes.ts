export interface Votes {
    snapshotCreatedAt: string | null;
    records: Record[];
    voteRecordsCreatedAt: string;
    conversionRate?: any;
    snapshots?: Votes[] // only on ranges query
    
  }
  export interface Record {
    amount: any;
    tokenOwner: string;
    validatorName?:string;
    validatorVoteAccount: string;
    directStake?: any;
    breakDown?:any[]
    source?: string
  }
  