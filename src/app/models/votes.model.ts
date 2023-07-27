export interface Votes {
    mSolSnapshotCreatedAt: string | null;
    records: Record[];
    voteRecordsCreatedAt: string;
    snapshots: Votes[]
  }
  export interface Record {
    amount: number;
    tokenOwner: string;
    validatorName?:string;
    validatorVoteAccount: string;
    directStake: any;
    breakDown:any[]
  }
  