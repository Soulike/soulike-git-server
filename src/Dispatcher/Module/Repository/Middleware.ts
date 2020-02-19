import {IRouteHandler} from '../../Interface';
import {Repository as RepositoryService} from '../../../Service';
import * as ParameterValidator from './ParameterValidator';
import {InvalidSessionError, WrongParameterError} from '../../Class';
import {Session as SessionFunction} from '../../../Function';

export const create: IRouteHandler = () =>
{
    return async (ctx) =>
    {
        if (!SessionFunction.isSessionValid(ctx.session))
        {
            throw new InvalidSessionError();
        }
        if (!ParameterValidator.create(ctx.request.body))
        {
            throw new WrongParameterError();
        }
        const {name, description, isPublic} = ctx.request.body;
        ctx.state.serviceResponse = await RepositoryService.create({name, description, isPublic}, ctx.session);
    };
};

export const del: IRouteHandler = () =>
{
    return async (ctx) =>
    {
        if (!SessionFunction.isSessionValid(ctx.session))
        {
            throw new InvalidSessionError();
        }
        if (!ParameterValidator.del(ctx.request.body))
        {
            throw new WrongParameterError();
        }
        const {name} = ctx.request.body;
        ctx.state.serviceResponse = await RepositoryService.del({name}, ctx.session);
    };
};

export const getRepositories: IRouteHandler = () =>
{
    return async (ctx) =>
    {
        if (!ParameterValidator.getRepositories(ctx.request.body))
        {
            throw new WrongParameterError();
        }
        const {start, end, username} = ctx.request.body;
        ctx.state.serviceResponse = await RepositoryService.getRepositories(start, end, ctx.session, username);
    };
};

export const fork: IRouteHandler = () =>
{
    return async ctx =>
    {
        const {username: usernameInSession} = ctx.session;
        if (typeof usernameInSession !== 'string')
        {
            throw new InvalidSessionError();
        }
        if (!ParameterValidator.fork(ctx.request.body))
        {
            throw new WrongParameterError();
        }
        const {username, name} = ctx.request.body;
        ctx.state.serviceResponse = await RepositoryService.fork({username, name}, usernameInSession);
    };
};