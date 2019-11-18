import {Account, Group, Profile, ResponseBody, ServiceResponse} from '../../Class';
import faker from 'faker';
import {checkPassword, checkSession, getAdministratingGroups, getGroups, login, logout, register} from '../Account';
import {Session} from 'koa-session';
import {InvalidSessionError} from '../../Dispatcher/Class';
import {Account as AccountTable} from '../../Database';

const fakeAccount = new Account(faker.random.word(), faker.random.alphaNumeric(64));

describe(login, () =>
{
    const databaseMock = {
        Account: {
            selectByUsername: jest.fn<ReturnType<typeof AccountTable.selectByUsername>,
                Parameters<typeof AccountTable.selectByUsername>>(),
        },
    };

    beforeEach(() =>
    {
        jest.resetModules();
        jest.mock('../../Database', () => databaseMock);
    });

    it('should check account existence', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(null);
        const {login} = await import('../Account');
        const response = await login(fakeAccount);
        expect(response).toEqual(new ServiceResponse<void>(200, {},
            new ResponseBody<void>(false, '用户名或密码错误')));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
    });

    it('should login and set session', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(fakeAccount);
        const {login} = await import('../Account');
        const response = await login(fakeAccount);
        expect(response).toEqual(new ServiceResponse<void>(200, {},
            new ResponseBody<void>(true), {username: fakeAccount.username}));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
    });

    it('should check password', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(fakeAccount);
        const {login} = await import('../Account');
        const response = await login({...fakeAccount, hash: faker.random.alphaNumeric(64)});
        expect(response).toEqual(new ServiceResponse<void>(200, {},
            new ResponseBody<void>(false, '用户名或密码错误')));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
    });
});

describe(register, () =>
{
    const databaseMock = {
        Account: {
            selectByUsername: jest.fn<ReturnType<typeof AccountTable.selectByUsername>,
                Parameters<typeof AccountTable.selectByUsername>>(),
            create: jest.fn<ReturnType<typeof AccountTable.create>,
                Parameters<typeof AccountTable.create>>(),
        },
    };

    beforeEach(() =>
    {
        jest.resetModules();
        jest.mock('../../Database', () => databaseMock);
    });

    it('should check account existence', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(fakeAccount);
        databaseMock.Account.create.mockResolvedValue(undefined);
        const {register} = await import('../Account');
        const response = await register(fakeAccount,
            new Profile('', faker.name.firstName(), faker.internet.email(), ''));
        expect(response).toEqual(new ServiceResponse<void>(200, {},
            new ResponseBody<void>(false, '用户名已存在')));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
        expect(databaseMock.Account.create.mock.calls.length).toBe(0);
    });

    it('should create account and profile', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(null);
        databaseMock.Account.create.mockResolvedValue(undefined);
        const fakeProfile = new Profile(fakeAccount.username, faker.random.word(), faker.internet.email(), '');
        const {register} = await import('../Account');
        const response = await register(fakeAccount,
            {
                nickname: fakeProfile.nickname,
                avatar: fakeProfile.avatar,
                email: fakeProfile.email,
            });
        expect(response).toEqual(new ServiceResponse<void>(200, {}, new ResponseBody<void>(true)));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
        expect(databaseMock.Account.create.mock.calls.pop()).toEqual([fakeAccount, fakeProfile]);
    });
});

describe(checkSession, () =>
{
    it('should check valid session', async function ()
    {
        const response = await checkSession({username: fakeAccount.username} as unknown as Session);
        expect(response).toEqual(new ServiceResponse<{ isValid: boolean }>(200, {},
            new ResponseBody(true, '', {isValid: true})));
    });

    it('should check invalid session', async function ()
    {
        let response = await checkSession({} as unknown as Session);
        expect(response).toEqual(new ServiceResponse<{ isValid: boolean }>(200, {},
            new ResponseBody(true, '', {isValid: false})));

        response = await checkSession({username: 111} as unknown as Session);
        expect(response).toEqual(new ServiceResponse<{ isValid: boolean }>(200, {},
            new ResponseBody(true, '', {isValid: false})));

        response = await checkSession({username: undefined} as unknown as Session);
        expect(response).toEqual(new ServiceResponse<{ isValid: boolean }>(200, {},
            new ResponseBody(true, '', {isValid: false})));
    });
});

describe(logout, () =>
{
    it('should invalidate session', async function ()
    {
        const result = await logout();
        expect(result).toEqual(new ServiceResponse<void>(200, {},
            new ResponseBody<void>(true), {username: undefined}));
    });
});

describe(getGroups, () =>
{
    const databaseMock = {
        Account: {
            selectByUsername: jest.fn<ReturnType<typeof AccountTable.selectByUsername>,
                Parameters<typeof AccountTable.selectByUsername>>(),
            getGroupsByUsername: jest.fn<ReturnType<typeof AccountTable.getGroupsByUsername>,
                Parameters<typeof AccountTable.getGroupsByUsername>>(),
        },
    };

    beforeEach(() =>
    {
        jest.resetModules();
        jest.mock('../../Database', () => databaseMock);
    });

    it('should check account existence', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(null);
        databaseMock.Account.getGroupsByUsername.mockResolvedValue([]);
        const {getGroups} = await import('../Account');
        const result = await getGroups(fakeAccount);
        expect(result).toEqual(new ServiceResponse<Group[]>(404, {},
            new ResponseBody<Group[]>(false, '用户不存在')));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
        expect(databaseMock.Account.getGroupsByUsername.mock.calls.length).toBe(0);
    });

    it('should get groups', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(fakeAccount);
        databaseMock.Account.getGroupsByUsername.mockResolvedValue([]);
        const {getGroups} = await import('../Account');
        const result = await getGroups(fakeAccount);
        expect(result).toEqual(new ServiceResponse<Group[]>(200, {},
            new ResponseBody<Group[]>(true, '', [])));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
        expect(databaseMock.Account.getGroupsByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
    });
});

describe(getAdministratingGroups, () =>
{
    const databaseMock = {
        Account: {
            selectByUsername: jest.fn<ReturnType<typeof AccountTable.selectByUsername>,
                Parameters<typeof AccountTable.selectByUsername>>(),
            getAdministratingGroupsByUsername: jest.fn<ReturnType<typeof AccountTable.getAdministratingGroupsByUsername>,
                Parameters<typeof AccountTable.getAdministratingGroupsByUsername>>(),
        },
    };

    beforeEach(() =>
    {
        jest.resetModules();
        jest.mock('../../Database', () => databaseMock);
    });

    it('should check account existence', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(null);
        databaseMock.Account.getAdministratingGroupsByUsername.mockResolvedValue([]);
        const {getAdministratingGroups} = await import('../Account');
        const result = await getAdministratingGroups(fakeAccount);
        expect(result).toEqual(new ServiceResponse<Group[]>(404, {},
            new ResponseBody<Group[]>(false, '用户不存在')));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
        expect(databaseMock.Account.getAdministratingGroupsByUsername.mock.calls.length).toBe(0);
    });

    it('should get administrating groups', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(fakeAccount);
        databaseMock.Account.getAdministratingGroupsByUsername.mockResolvedValue([]);
        const {getAdministratingGroups} = await import('../Account');
        const result = await getAdministratingGroups(fakeAccount);
        expect(result).toEqual(new ServiceResponse<Group[]>(200, {},
            new ResponseBody<Group[]>(true, '', [])));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
        expect(databaseMock.Account.getAdministratingGroupsByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
    });
});

describe(checkPassword, () =>
{
    const databaseMock = {
        Account: {
            selectByUsername: jest.fn<ReturnType<typeof AccountTable.selectByUsername>,
                Parameters<typeof AccountTable.selectByUsername>>(),
        },
    };

    beforeEach(() =>
    {
        jest.resetModules();
        jest.mock('../../Database', () => databaseMock);
    });

    it('should throw error when session is invalid', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(null);
        await expect(
            checkPassword(fakeAccount, {} as unknown as Session))
            .rejects.toBeInstanceOf(InvalidSessionError);
        expect(databaseMock.Account.selectByUsername.mock.calls.length).toBe(0);
    });

    it('should work when account does not exist', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(null);
        const {checkPassword} = await import('../Account');
        const result = await checkPassword(
            {hash: fakeAccount.hash},
            {username: fakeAccount.username} as unknown as Session);
        expect(result).toEqual(new ServiceResponse(200, {},
            new ResponseBody(true, '', {isCorrect: false})));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
    });

    it('should work when password is correct', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(fakeAccount);
        const {checkPassword} = await import('../Account');
        const result = await checkPassword(
            {hash: fakeAccount.hash},
            {username: fakeAccount.username} as unknown as Session);
        expect(result).toEqual(new ServiceResponse(200, {},
            new ResponseBody(true, '', {isCorrect: true})));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
    });

    it('should work when password is wrong', async function ()
    {
        databaseMock.Account.selectByUsername.mockResolvedValue(fakeAccount);
        const {checkPassword} = await import('../Account');
        const result = await checkPassword(
            {hash: faker.random.alphaNumeric(64)},
            {username: fakeAccount.username} as unknown as Session);
        expect(result).toEqual(new ServiceResponse(200, {},
            new ResponseBody(true, '', {isCorrect: false})));
        expect(databaseMock.Account.selectByUsername.mock.calls.pop()).toEqual([fakeAccount.username]);
    });
});