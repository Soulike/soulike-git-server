import Router from '@koa/router';
import {CREATE, DEL, FORK, GET_REPOSITORIES, IS_MERGEABLE} from './ROUTE';
import JSONQuerystringParser from '../../Middleware/JSONQuerystringParser';
import {create, del, fork, getRepositories, isMergeable} from './Middleware';
import bodyParser from '../../Middleware/bodyParser';
import {IContext, IState} from '../../Interface';
import sessionChecker from '../../Middleware/sessionChecker';

export default (router: Router<IState, IContext>) =>
{
    router.post(CREATE, sessionChecker(), bodyParser(), create())
        .post(DEL, sessionChecker(), bodyParser(), del())
        .get(GET_REPOSITORIES, JSONQuerystringParser(), getRepositories())
        .post(FORK, sessionChecker(), bodyParser(), fork())
        .get(IS_MERGEABLE, JSONQuerystringParser(), isMergeable());
};