
export type ResourceInfo = { url: string, type: string, name: string, subkeys?: string }

export type ResourceConfigFile = {
    groups: { name: string, keys: string }[],
    resources: ResourceInfo[]
}

export type ResourceConfig = {
    resources: {
        [name: string]: ResourceInfo
    },
    groups: {
        [name: string]: string[]
    },
    alias: {
        [name: string]: string
    }
}

export type Store = {
    config: ResourceConfig
}