export interface Votes {
    mSolSnapshotCreatedAt: string | null;
    records: Record[];
    voteRecordsCreatedAt: string;
  }
  export interface Record {
    amount: number;
    tokenOwner: string;
    validatorVoteAccount: string;
    directStake: any;
    breakDown:any[]
  }
  