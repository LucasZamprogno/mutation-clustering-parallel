export interface IQueryTest {
    id: string;
    title: string;
    description: string;
    query: any;
    isQueryValid: string;
    result: any[] | string;
}
