export interface TTodo {
  text: string;
  deadline: [Date | null, Date | null]; 
  completed: boolean;
  id: string;
}