import * as vscode from 'vscode';

function getIndentLevel(document: vscode.TextDocument, insertSpaces: boolean, lineIndex: number): number {
	if (lineIndex < 0 || lineIndex >= document.lineCount) {
		return 0;
	}
	return document.lineAt(lineIndex).firstNonWhitespaceCharacterIndex;
}

function getIndentationFor(spaces: boolean, level: number): string {
	return spaces
		? ' '.repeat(level)
		: '\t'.repeat(level);
}

function detectIndentationStyle(document: vscode.TextDocument): boolean {
	const lines = document.getText().split('\n');
	let spaceCount = 0;
	let tabCount = 0;
	
	for (const line of lines) {
		if (!line.trim()) {
			continue;
		}
		
		const leadingSpaces = line.match(/^ +/);
		const leadingTabs = line.match(/^\t+/);
		
		if (leadingSpaces) {
			spaceCount++;
		}
		if (leadingTabs) {
			tabCount++;
		}
		
		if (spaceCount > 10 || tabCount > 10) {
			break;
		}
	}
	
	if (tabCount > spaceCount) {
		return false;
	} else if (spaceCount > 0) {
		return true;
	} else {
		return true;
	}
}

export function activate(context: vscode.ExtensionContext) {
	
	const fixPits = vscode.commands.registerCommand('pitFighter.fixPits', () => {
		const editor = vscode.window.activeTextEditor;
		
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found to fix line pits!');
			return;
		}
		
		const document = editor.document;
		const insertSpaces = detectIndentationStyle(document);
		const edits = [];
		const tempEdits = [];
		
		for (let i=0; i<document.lineCount; i++) {
			const line = document.lineAt(i);
			
			if (line.isEmptyOrWhitespace) {
				const previousLineIndent = getIndentLevel(document, insertSpaces, i - 1);
				const nextLineIndent = getIndentLevel(document, insertSpaces, i + 1);
				const indentLevel = Math.max(previousLineIndent, nextLineIndent);
				
				let indentText: string;
				if (previousLineIndent === 0 && tempEdits[i - 1] !== undefined) {
					indentText = tempEdits[i - 1];
				} else {
					indentText = getIndentationFor(insertSpaces, indentLevel);
				}
				
				if (line.text !== indentText) {
					tempEdits[i] = indentText;
					edits.push(vscode.TextEdit.replace(line.range, indentText));
				}
			}
		}
		
		if (edits.length > 0) {
			const edit = new vscode.WorkspaceEdit();
			edit.set(document.uri, edits);
			vscode.workspace.applyEdit(edit);
		} else {
			vscode.window.showInformationMessage('No line pits found!');
		}
	});
	
	context.subscriptions.push(fixPits);
}

export function deactivate() {}
