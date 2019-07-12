import {Course, Room} from "./DatasetManager";

// Do I need this? Not really. Am I keeping it? yup
export interface IDatasetParser {
    parse(content: string, id: string): Promise<Course[] | Room[]>;
}
