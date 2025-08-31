/*************************************************************************************************

Welcome to Baml! To use this generated code, please run one of the following:

$ npm install @boundaryml/baml
$ yarn add @boundaryml/baml
$ pnpm add @boundaryml/baml

*************************************************************************************************/

/******************************************************************************
 *
 *  These types are used for streaming, for when an instance of a type
 *  is still being built up and any of its fields is not yet fully available.
 *
 ******************************************************************************/

export interface StreamState<T> {
  value: T;
  state: 'Pending' | 'Incomplete' | 'Complete';
}

export namespace partial_types {
  export interface ImprovementSuggestions {
    seo: string[];
    accessibility: string[];
    performance: string[];
    overall_priority: string[];
  }
}
