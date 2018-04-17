/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { OutputChannel } from 'vscode';
import { IActionContext, IAzureUserInput } from '../../index';
import { AzureWizardExecuteStep } from './AzureWizardExecuteStep';
import { AzureWizardPromptStep } from './AzureWizardPromptStep';

export class AzureWizard<T> {
    private readonly _promptSteps: AzureWizardPromptStep<T>[];
    private readonly _executeSteps: AzureWizardExecuteStep<T>[];
    private readonly _subWizards: AzureWizard<T>[] = [];
    private _wizardContext: T;

    public constructor(promptSteps: AzureWizardPromptStep<T>[], executeSteps: AzureWizardExecuteStep<T>[], wizardContext: T) {
        this._promptSteps = promptSteps;
        this._executeSteps = executeSteps;
        this._wizardContext = wizardContext;
    }

    public async prompt(actionContext: IActionContext, ui: IAzureUserInput): Promise<T> {
        for (const step of this._promptSteps) {
            actionContext.properties.lastStepAttempted = `prompt-${step.constructor.name}`;
            this._wizardContext = await step.prompt(this._wizardContext, ui);

            if (step.subWizard) {
                this._subWizards.push(step.subWizard);
                await step.subWizard.prompt(actionContext, ui);
            }
        }

        return this._wizardContext;
    }

    public async execute(actionContext: IActionContext, outputChannel: OutputChannel): Promise<T> {
        outputChannel.show(true);

        for (const subWizard of this._subWizards) {
            await subWizard.execute(actionContext, outputChannel);
        }

        for (const step of this._executeSteps) {
            actionContext.properties.lastStepAttempted = `execute-${step.constructor.name}`;
            this._wizardContext = await step.execute(this._wizardContext, outputChannel);
        }

        return this._wizardContext;
    }
}
