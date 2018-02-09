import {
  ActorQueryOperation,
  ActorQueryOperationTypedMediated,
  IActorQueryOperationOutput,
  IActorQueryOperationTypedMediatedArgs,
} from "@comunica/bus-query-operation";
import {IActorTest} from "@comunica/core";
import {AsyncIterator, EmptyIterator, MultiTransformIterator} from "asynciterator";
import {variable} from "rdf-data-model";
import * as RDF from "rdf-js";
import {Algebra} from "sparqlalgebrajs";
import {BindingsToQuadsIterator} from "./BindingsToQuadsIterator";

/**
 * A comunica Construct Query Operation Actor.
 */
export class ActorQueryOperationConstruct extends ActorQueryOperationTypedMediated<Algebra.Construct> {

  constructor(args: IActorQueryOperationTypedMediatedArgs) {
    super(args, 'construct');
  }

  /**
   * Find all variables in a list of triple patterns.
   * @param {Algebra.Pattern[]} patterns An array of triple patterns.
   * @return {RDF.Variable[]} The variables in the triple patterns.
   */
  public static getVariables(patterns: RDF.Quad[]): RDF.Variable[] {
    const variables: {[label: string]: boolean} = {};
    for (const pattern of patterns) {
      if (pattern.subject.termType === 'Variable') {
        variables[pattern.subject.value] = true;
      }
      if (pattern.predicate.termType === 'Variable') {
        variables[pattern.predicate.value] = true;
      }
      if (pattern.object.termType === 'Variable') {
        variables[pattern.object.value] = true;
      }
      if (pattern.graph.termType === 'Variable') {
        variables[pattern.graph.value] = true;
      }
    }
    return Object.keys(variables).map(variable);
  }

  public async testOperation(pattern: Algebra.Construct, context?: {[id: string]: any}): Promise<IActorTest> {
    return true;
  }

  public async runOperation(pattern: Algebra.Construct, context?: {[id: string]: any})
    : Promise<IActorQueryOperationOutput> {
    // If our template is empty or contains no variables, no need to resolve a query.
    const variables: RDF.Variable[] = ActorQueryOperationConstruct.getVariables(pattern.template);
    if (variables.length === 0) {
      return {
        metadata: Promise.resolve({ totalItems: 0 }),
        quadStream: new EmptyIterator(),
        type: 'quads',
        variables: [],
      };
    }

    // Apply a projection on our CONSTRUCT variables first, as the query may contain other variables as well.
    const operation: Algebra.Operation = { type: 'project', input: pattern.input, variables };

    // Evaluate the input query
    const output: IActorQueryOperationOutput = await this.mediatorQueryOperation.mediate({ operation, context });
    ActorQueryOperation.validateQueryOutput(output, 'bindings');

    // construct triples using the result based on the pattern.
    const quadStream: AsyncIterator<RDF.Quad> = new BindingsToQuadsIterator(pattern.template, output.bindingsStream);

    // Let the final metadata contain the estimated number of triples
    let metadata: Promise<{[id: string]: any}> = null;
    if (output.metadata) {
      metadata = output.metadata.then((m) => {
        if (m) {
          if (m.totalItems) {
            return Object.assign({}, m, { totalItems: m.totalItems * pattern.template.length });
          }
          return m;
        }
        return null;
      });
    }

    return {
      metadata,
      quadStream,
      type: 'quads',
      variables: [],
    };
  }

}
