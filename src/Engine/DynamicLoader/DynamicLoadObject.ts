/** @packageDocumentation @module DynamicLoader */

export interface ResourceRequirements
{
    // type: string;
    key: string;
    // uri: string;
    metadata: any;
    callback: (key: string, type: string, fileObj: any) => void;
}

export interface DynamicLoadObject
{
    loadComplete: boolean;
    resources: ResourceRequirements[];
    fetchChildren(): DynamicLoadObject[];
    onLoadComplete(key: string, type: string, fileObj: any): void;
}