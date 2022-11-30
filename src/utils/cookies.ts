import { IOptionsCookie } from '@/interfaces/ICookie'
import IListItem from '@/interfaces/IListItem'


export class Util {
    static setCookie(name : string, value : IListItem[], options: IOptionsCookie) {


        if (!name || !value) return false;

        let expires = options['expres']
        const path = options['path'] 

        if (!(expires instanceof Date)){
            expires = new Date((new Date()).setFullYear(new Date().getFullYear() + 1));
        }

        const cookieString = `${name}=${JSON.stringify(value)}; ${expires ? 'expires=' + expires.toUTCString() : ''}; ${path ? 'path=' + path + '/' : ''}`;

        document.cookie = cookieString;

        return Util.getCookie(name);
    }

    static getCookie(name: string) {
        if (!name) return false;

        name = name + '=';

        const cookieList = decodeURIComponent(document.cookie).split(';');

        for (let i = 0; i < cookieList.length; i++) {
            let c = cookieList[i];

            while (c.charAt(0) == ' ') c = c.substring(1);

            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }

        return false;
    }
}