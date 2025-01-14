interface GoogleDistanceMatrixResponse {
    destination_addresses: string[];
    origin_addresses: string[];
    rows: {
      elements: {
        status: string;
        distance?: {
          text: string; 
          value: number; 
        };
        duration?: {
          text: string; 
          value: number; 
        };
      }[];
    }[];
    status: string; 
}