export interface SolblazeDS {
    
        success: boolean,
        boost: {
          staked: number,
          pool: number,
          match: number,
          conversion: number
        },

        stats: {
          staked: number,
          pool: number,
          match: number,
          conversion: number
        },
        applied_stakes: {
            [key: string]: { // validator identity
                [key: string]: number // voter + amount stake
            }
        }
        votes: {
          [key: string]: { // validator identity
              [key: string]: number // voter + amount stake
          }
      }
}