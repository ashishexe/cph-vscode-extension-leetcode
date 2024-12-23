import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { fetchTestCases } from './fetchTestCases';
import { executeCode } from './executeCode';

export function activate(context: vscode.ExtensionContext) {
    console.log('LeetCode Helper Extension Activated!');

    const baseDirectory = path.join(context.extensionPath, 'dist', 'test_cases');
    // Ensure base directory exists
    if (!fs.existsSync(baseDirectory)) {
        fs.mkdirSync(baseDirectory, { recursive: true });
    }

    // Command: Fetch LeetCode Test Cases
    const fetchCommand = vscode.commands.registerCommand(
        'leetcode-cph-helper-by-ashish.fetchLeetCodeTestCases',
        async () => {
            const url = await vscode.window.showInputBox({
                prompt: 'Enter the LeetCode problem URL',
                placeHolder: 'https://leetcode.com/problems/example-problem/',
            });

            if (!url) {
                vscode.window.showWarningMessage('No URL provided!');
                return;
            }

            vscode.window.withProgress(
                { location: vscode.ProgressLocation.Notification, title: 'Fetching LeetCode Test Cases...' },
                async () => {
                    try {
                        await fetchTestCases(url);
                        vscode.window.showInformationMessage('Test cases fetched successfully!');
                    } catch (error) {
                        vscode.window.showErrorMessage(`Failed to fetch test cases: ${error}`);
                    }
                }
            );
        }
    );

    // Command: Get IO File Directory
    const getIOFileDirectoryCommand = vscode.commands.registerCommand(
        'leetcode-cph-helper-by-ashish.getIOFileDirectory',
        async () => {
            try {
                // Copy the directory path to the clipboard
                await vscode.env.clipboard.writeText(baseDirectory);
                vscode.window.showInformationMessage(`You can now paste the file location: ${baseDirectory}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        }
    );

    // Command: Write Solution File
    const writeSolutionFileCommand = vscode.commands.registerCommand(
        'leetcode-cph-helper-by-ashish.writeSolutionFile',
        async () => {
            try {
                const language = await vscode.window.showQuickPick(['python', 'cpp'], {
                    placeHolder: 'Choose the programming language (python or cpp)',
                });

                if (!language) {
                    vscode.window.showWarningMessage('No language selected!');
                    return;
                }

                const baseFileName = language === 'python' ? 'solution.py' : 'solution.cpp';
                let filePath = path.join(baseDirectory, baseFileName);

                if (fs.existsSync(filePath)) {
                    const action = await vscode.window.showQuickPick(['Overwrite', 'Create New File'], {
                        placeHolder: `File '${baseFileName}' already exists. What would you like to do?`,
                    });

                    if (action === 'Create New File') {
                        let counter = 1;
                        while (fs.existsSync(filePath)) {
                            const newFileName = language === 'python' ? `solution_${counter}.py` : `solution_${counter}.cpp`;
                            filePath = path.join(baseDirectory, newFileName);
                            counter++;
                        }
                        vscode.window.showInformationMessage(`Creating new file: ${path.basename(filePath)}`);
                    } else if (action === 'Overwrite') {
                        vscode.window.showInformationMessage(`Overwriting existing file: ${baseFileName}`);
                    } else {
                        throw new Error('File creation cancelled.');
                    }
                }

                const boilerplate = language === 'python'
                    ? `
import os

def run_test_case(test_case_number, function):
    # Determine the base directory dynamically\n
    base_directory = os.path.dirname(os.path.dirname(__file__))\n
    file_path = os.path.join(base_directory, 'test_cases', f"input_{test_case_number}.txt")\n

    try:\n
        # Read the input file\n
        with open(file_path, "r") as file:\n
            content = file.read().strip().splitlines()  # Read file and split lines\n

        # Dynamically parse all lines as arguments\n
        args = [eval(line.strip()) for line in content]  # Parse each line in the file\n

        # Call the provided function with all parsed arguments\n
        result = function(*args)  # Unpack the arguments dynamically\n
        print(result)  # Output the result\n

    except FileNotFoundError:\n
        print(f"Error: File not found at {file_path}. Check the file path and try again.")\n
    except ValueError as e:\n
        print(f"Error: {e}")\n
    except SyntaxError as e:\n
        print(f"Error: Check your input file format. {e}")\n
    except Exception as e:\n
        print(f"Unexpected Error: {e}")\n


# WRITE YOUR FUNCTION HERE 
#-------------------------------------------------------------------------------\n

#-------------------------------------------------------------------------------\n

#run_test_case(ENTER THE TESTCASE NUMBER, ENTER THE FUNCTION NAME)\n
# EXAMPLE:\n
run_test_case()  # Replace with the relevant test case number and function name\n

`
                    : `#include <bits/stdc++.h>
#include <filesystem>
#include <functional>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

using namespace std;
namespace fs = std::filesystem;

template <typename T>
T parseValue(const string& str) {
    istringstream iss(str);
    T value;
    iss >> value;
    return value;
}

template <>
string parseValue<string>(const string& str) {
    return str;
}

template <typename T>
vector<T> parseArray(const string& str) {
    vector<T> result;
    string trimmedStr = str.substr(1, str.size() - 2); // Remove the surrounding brackets
    istringstream iss(trimmedStr);
    string item;
    while (getline(iss, item, ',')) {
        result.push_back(parseValue<T>(item));
    }
    return result;
}

void run_test_case(int test_case_number, const function<void(const vector<string>&)>& function) {
    // Determine the base directory dynamically
    fs::path base_directory = fs::path(__FILE__).parent_path().parent_path();
    fs::path file_path = base_directory / "test_cases" / ("input_" + to_string(test_case_number) + ".txt");

    try {
        // Read the input file
        ifstream file(file_path);
        if (!file.is_open()) {
            throw runtime_error("File not found at " + file_path.string());
        }

        string line;
        vector<string> args;
        while (getline(file, line)) {
            args.push_back(line);
        }

        if (args.empty()) {
            throw runtime_error("Invalid input format");
        }

        // Call the provided function with all parsed arguments
        function(args);

    } catch (const exception& e) {
        cerr << "Error: " << e.what() << endl;
    }
}
// YOU CAN CHANGE THE NAME OF THE FUNCTION

void exampleFunction(const vector<string>& args) {
    // Example function that handles different types of inputs
    for (const auto& arg : args) {
        if (arg.front() == '[' && arg.back() == ']') {
            
        // if the variable in the question is an array declare it here 
            //example - auto array_name = parseArray<int>(arg);
            auto array = parseArray<int>(arg);
            cout << "Array: ";
            for (const auto& item : array) {
                cout << item << " ";
            }
            cout << endl;
        } else if (arg.front() == '"' && arg.back() == '"') {
            //if the variable in the question is a string declare it here
            //example - string str = parseValue<string>(arg.substr(1, arg.size() - 2));

            string str = parseValue<string>(arg.substr(1, arg.size() - 2));
            cout << "String: " << str << endl;
        } else {
           //if the variable in the question is a number declare it here
           //example - int num = parseValue<int>(arg);
            int num = parseValue<int>(arg);
            cout << "Number: " << num << endl;
        }
    }
}

int main() {
     // Provide the test case number and function name
    //example - run_test_case(ENTER YOUR TEST CASE NUMBER,YOUR FUNCTION NAME);

    run_test_case();
    return 0;
}`;

                fs.writeFileSync(filePath, boilerplate, 'utf-8');

                const document = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(document);

                vscode.window.showInformationMessage(`Solution file '${path.basename(filePath)}' is ready in ${baseDirectory}.`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`Error creating solution file: ${errorMessage}`);
            }
        }
    );

    // Command: Run Test Cases
    const runCommand = vscode.commands.registerCommand(
        'leetcode-cph-helper-by-ashish.runTestCases',
        async () => {
            try {
                const activeEditor = vscode.window.activeTextEditor;

                if (!activeEditor) {
                    vscode.window.showWarningMessage('No active editor detected. Please open your solution file first.');
                    return;
                }

                const filePath = activeEditor.document.fileName;
                const language = filePath.endsWith('.py') ? 'python' : filePath.endsWith('.cpp') ? 'cpp' : null;

                if (!language) {
                    vscode.window.showWarningMessage('Unsupported file type. Only Python and C++ files are supported.');
                    return;
                }

                if (!fs.existsSync(baseDirectory)) {
                    vscode.window.showErrorMessage('Test cases directory not found.');
                    return;
                }

                const inputFiles = fs.readdirSync(baseDirectory)
                    .filter((file) => file.startsWith('input_') && file.endsWith('.txt'));

                const totalTestCases = inputFiles.length;

                if (totalTestCases === 0) {
                    vscode.window.showWarningMessage('No test cases found to run.');
                    return;
                }

                const testCaseOptions = inputFiles.map((file, index) => ({
                    label: `Test Case ${index + 1}`,
                    description: file,
                    index: index + 1
                }));

                const selectedTestCase = await vscode.window.showQuickPick(testCaseOptions, {
                    placeHolder: 'Select a test case to run'
                });

                if (!selectedTestCase) {
                    vscode.window.showWarningMessage('No test case selected!');
                    return;
                }

                const testCaseNumber = selectedTestCase.index;

                vscode.window.withProgress(
                    { location: vscode.ProgressLocation.Notification, title: 'Running Test Case...' },
                    async () => {
                        try {
                            const results: string[] = [];

                            try {
                                const output = await executeCode(filePath, language, testCaseNumber);
                                const expectedOutputPath = path.join(baseDirectory, `output_${testCaseNumber}.txt`);
                                let expectedOutput = fs.existsSync(expectedOutputPath) ? fs.readFileSync(expectedOutputPath, 'utf-8').trim() : 'N/A';

                                // Remove quotes from the expected output if it is a string
                                if (expectedOutput.startsWith('"') && expectedOutput.endsWith('"')) {
                                    expectedOutput = expectedOutput.slice(1, -1);
                                }

                                // Normalize the outputs for comparison
                                const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
                                const normalizedResult = normalize(output);
                                const normalizedExpectedOutput = normalize(expectedOutput);

                                const resultMessage = normalizedResult === normalizedExpectedOutput
                                    ? `✅🗿 Test Case ${testCaseNumber}: Passed! 🗿\n`
                                    : `❌😭 Test Case ${testCaseNumber}: Failed! 😭\n`;

                                results.push(`${resultMessage}Expected Output: ${normalizedExpectedOutput}\nActual Output: ${normalizedResult}`);
                            } catch (innerError) {
                                const errorMessage = innerError instanceof Error ? innerError.message : String(innerError);
                                const expectedOutputPath = path.join(baseDirectory, `output_${testCaseNumber}.txt`);
                                const expectedOutput = fs.existsSync(expectedOutputPath) ? fs.readFileSync(expectedOutputPath, 'utf-8').trim() : 'N/A';
                                results.push(`❌😭 Test Case ${testCaseNumber}: Failed! 😭 \nError: ${errorMessage}\nExpected Output: ${expectedOutput}\nActual Output: N/A`);
                            }

                            const summary = results.join('\n\n');
                            vscode.window.showInformationMessage(`Test Case Summary:\n\n${summary}`, { modal: true });

                        } catch (error) {
                            vscode.window.showErrorMessage(`Error running test case: ${String(error)}`);
                        }
                    }
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        }
    );

    // Register commands in context
    context.subscriptions.push(fetchCommand, getIOFileDirectoryCommand, writeSolutionFileCommand, runCommand);
}

export function deactivate() {
    console.log('LeetCode Helper Extension Deactivated!');
}