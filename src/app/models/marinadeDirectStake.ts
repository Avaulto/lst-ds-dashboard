export interface MarinadeDS {
    mSolSnapshotCreatedAt: string | null;
    records: Record[];
    voteRecordsCreatedAt: string;
    snapshots: MarinadeDS[] // only on ranges query
  }
  export interface Record {
    amount: number;
    tokenOwner: string;
    validatorVoteAccount: string;
  }
  