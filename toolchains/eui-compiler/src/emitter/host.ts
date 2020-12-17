export class EmitterHost {

    list: any[] = [];

    insertClassDeclaration(x: any) {
        this.list.push(x);
    }

}
