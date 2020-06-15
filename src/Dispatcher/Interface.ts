import Router from '@koa/router';
import {ISession} from '../Interface';
import {Session} from 'koa-session';

export interface IParameterValidator
{
    (body: Readonly<any>): boolean
}

export interface IState
{
    serviceResponse: Readonly<any>
}

export interface IContext
{
    session: Session & ISession;
}

export interface IRouteHandler
{
    (): Router.Middleware<IState, IContext>
}

export interface IDispatcher
{
    (router: Router<IState, IContext>): void
}