export interface Votes {
    mSolSnapshotCreatedAt: string | null;
    records: Record[];
    voteRecordsCreatedAt: string;
  }
  interface Record {
    amount: number;
    tokenOwner: string;
    validatorVoteAccount: string;
  }
  