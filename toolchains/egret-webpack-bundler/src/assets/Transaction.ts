import { Compilation, Compiler } from "webpack";
import * as path from 'path';
import { fileChanged } from "../loaders/utils";

export abstract class Transaction {

    abstract get fileDependencies(): string[]

    abstract execute(compilation: Compilation): Promise<void>
}