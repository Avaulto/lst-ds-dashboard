export interface Votes {
    mSolSnapshotCreatedAt: string | null;
    records: Record[];
    voteRecordsCreatedAt: string;
  }
  interface Record {
    amount: string | null;
    tokenOwner: string;
    validatorVoteAccount: string;
  }
  