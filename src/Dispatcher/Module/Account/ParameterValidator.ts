import {Account, Profile} from '../../../Class';
import {IParameterValidator} from '../../Interface';

export const login: IParameterValidator = (body: any) =>
{
    return Account.validate(body);
};

export const register: IParameterValidator = (body: any) =>
{
    const {account, profile} = body;
    return Account.validate(account) && Profile.validate({username: '', ...profile});
};

export const getGroups: IParameterValidator = body =>
{
    const {username} = body;
    return typeof username === 'string';
};

export const getAdministratingGroups = getGroups;