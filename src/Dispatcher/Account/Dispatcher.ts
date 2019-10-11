import Router from '@koa/router';
import {CHECK_SESSION, LOGIN, REGISTER} from './ROUTE';
import koaBody from 'koa-body';
import {BODY} from '../../CONFIG';
import {Account, Profile, ResponseBody} from '../../Class';
import {Account as AccountService} from '../../Service';

export default (router: Router) =>
{
    router.post(LOGIN, koaBody(BODY), async (ctx) =>
    {
        const {username, hash} = ctx.request.body;
        if (!Account.validate({username, hash}))
        {
            ctx.response.status = 400;
            ctx.response.body = new ResponseBody<void>(false, '请求参数错误');
        }
        else
        {
            const {statusCode, headers, body} = await AccountService.login(
                {username, hash}, ctx.session);
            if (headers)
            {
                ctx.response.set(headers);
            }
            ctx.response.body = body;
            ctx.response.status = statusCode;
        }
    });

    router.post(REGISTER, koaBody(BODY), async (ctx) =>
    {
        const {account, profile} = ctx.request.body;
        const {username, hash} = account;
        const {nickname, avatar, email} = profile;
        if (!Account.validate(account) && !Profile.validate({username: '', ...profile}))
        {
            ctx.response.status = 400;
            ctx.response.body = new ResponseBody<void>(false, '请求参数错误');
        }
        else
        {
            const {statusCode, headers, body} = await AccountService.register(
                {username, hash}, {nickname, avatar, email});
            if (headers)
            {
                ctx.response.set(headers);
            }
            ctx.response.body = body;
            ctx.response.status = statusCode;
        }
    });

    router.get(CHECK_SESSION, async (ctx) =>
    {
        const {username} = ctx.session;
        ctx.response.body = new ResponseBody(true, '',
            {isValid: typeof username === 'string'},
        );
    });
};