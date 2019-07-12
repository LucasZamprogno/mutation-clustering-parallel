interface ITitleComponents {
    name: string;
    description?: string;
}

export interface ITestReport {
    failNames: string[];
    passNames: string[];
    skipNames: string[];
}

export abstract class TestReport implements ITestReport {
    public readonly failNames: string[];
    public readonly passNames: string[];
    public readonly skipNames: string[];

    protected constructor(failNames: string[], passNames: string[], skipNames: string[]) {
        this.failNames = failNames;
        this.passNames = passNames;
        this.skipNames = skipNames;
    }

    /**
     * Combines the test name and description (if provided) into a single string.
     * @param {ITitleComponents} t An object containing the test name and optionally its description.
     * @returns {string} A string combining the name and description.
     */
    protected static formatName(t: ITitleComponents): string {
        return t.name ? t.name + ": " + t.description : t.description!;
    }

    /**
     * Uses the supplied delimiter to split a test title into a name and a description.
     * @param {string} title The test title (or full test name).
     * @param {string} delimiter The delimiter surrounding the test name.
     * @returns ITitleComponents The components of the test title.
     */
    protected static parseName(title: string, delimiter: string = "~"): ITitleComponents {
        const nameStart: number = title.indexOf(delimiter) + 1;
        const nameEnd: number = title.lastIndexOf(delimiter);
        const name: string = title.substring(nameStart, nameEnd).trim();
        const description: string = title.substring(nameEnd + 1).trim().replace(/\.$/, "");

        return { name, description };
    }
}
