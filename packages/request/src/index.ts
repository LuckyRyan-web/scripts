import axios, { AxiosRequestConfig, AxiosError } from 'axios'
import qs from 'qs'

declare module 'axios' {
    interface AxiosRequestConfig {
        /** 不显示错误 */
        hideError?: boolean
        /** 跳过队列 */
        skipQueue?: boolean
    }
}

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** 接口报错提醒 */
let notification = (msg: string) => {
    alert(msg)
}

export function setNotification(func: () => void) {
    notification = func
}

export function getNotification() {
    return notification
}

export type AxOptions = Optional<AxiosRequestConfig, 'headers'>

/** 错误消息队列，同一个错误5秒内显示一次 */
const notificationQueue: { [key: string]: any } = {}

/** 错误消息处理 */
let handleError = (err: AxiosError) => {
    const response = err.response

    if (axios.isCancel(err)) {
        console.warn(err)
    } else {
        // @ts-ignore
        let message: string = response && response.data ? response.data.message : err.message

        if (message.includes('Network Error')) {
            message = '网络错误'
        }

        if (!notificationQueue[message]) {
            notificationQueue[message] = true
            setTimeout(() => {
                notificationQueue[message] = false
            }, 5000)
            notification(message)
        }
    }
}

/** 设置报错方法 */
export function setHandleError(handlerFunc: (err: AxiosError) => void) {
    handleError = handlerFunc
}

/**
 * 请求方法函数
 * @param baseURL
 * @param createConfig
 * @returns
 */
export function createRequest(baseURL: string, createConfig?: AxiosRequestConfig) {
    const ax = axios.create({
        baseURL,
        timeout: 30000,
        responseType: 'json',
        paramsSerializer: {
            serialize: (params) => {
                return qs.stringify(params, { indices: false })
            },
        },
        ...createConfig,
    })

    function get<T>(
        url: string,
        data: { params?: any; body?: any } = {},
        options: AxOptions = {},
        extOptions?: {
            [key: string]: any
            headers?: any
        },
    ): Promise<T> {
        if (extOptions) {
            options = Object.assign(options, extOptions)
        }

        const httpQueue: { [key: string]: any } = {}

        const queueKey = url + ':' + qs.stringify(data)

        if (!options.skipQueue) {
            if (httpQueue[queueKey] && Array.isArray(httpQueue[queueKey])) {
                return new Promise((resolve, reject) => {
                    httpQueue[queueKey].push({
                        resolve,
                        reject,
                    })
                })
            }

            httpQueue[queueKey] = []
        }

        return ax
            .request({
                method: 'GET',
                url,
                params: data.params,
                data: data.body,
                ...options,
            })
            .then((res) => {
                if (!options.skipQueue) {
                    // 将结果通知队列成员
                    httpQueue[queueKey].forEach((promise: PromiseConstructor) => {
                        try {
                            promise.resolve(JSON.parse(JSON.stringify(res.data)))
                        } catch (err) {
                            promise.resolve()
                        }
                    })
                    // 删除队列
                    delete httpQueue[queueKey]
                }

                return res.data
            })
            .catch((err) => {
                if (!options.skipQueue) {
                    httpQueue[queueKey].forEach((promise: PromiseConstructor) => {
                        promise.reject(err)
                    })

                    delete httpQueue[queueKey]
                }

                if (!options.hideError) {
                    handleError(err)
                }

                throw err
            })
    }

    function post<T>(
        url: string,
        data: { params?: any; body?: any } = {},
        options: AxOptions = {},
        extOptions?: {
            [key: string]: any
            headers?: any
        },
    ): Promise<T> {
        if (extOptions) {
            options = Object.assign(options, extOptions)
        }
        const ax = axios
            .request({
                method: 'POST',
                url,
                params: data.params,
                data: data.body,
                ...options,
            })
            .then((res) => {
                return res.data
            })
            .catch((err) => {
                if (!options.hideError) {
                    handleError(err)
                }
                throw err
            })

        return ax
    }

    function put<T>(
        url: string,
        data: { params?: any; body?: any } = {},
        options: AxOptions = {},
        extOptions?: {
            [key: string]: any
            headers?: any
        },
    ): Promise<T> {
        if (extOptions) {
            options = Object.assign(options, extOptions)
        }

        const ax = axios
            .request({
                method: 'PUT',
                url,
                params: data.params,
                data: data.body,
                ...options,
            })
            .then((res) => {
                return res.data
            })
            .catch((err) => {
                if (!options.hideError) {
                    handleError(err)
                }
                throw err
            })

        return ax
    }

    function del<T>(
        url: string,
        data: { params?: any; body?: any } = {},
        options: AxOptions = {},
        extOptions?: {
            [key: string]: any
            headers?: any
        },
    ): Promise<T> {
        if (extOptions) {
            options = Object.assign(options, extOptions)
        }

        const ax = axios
            .request({
                method: 'DELETE',
                url,
                params: data.params,
                data: data.body,
                ...options,
            })
            .then((res) => {
                return res.data
            })
            .catch((err) => {
                if (!options.hideError) {
                    handleError(err)
                }
                throw err
            })

        return ax
    }

    return {
        ax,
        get,
        post,
        put,
        delete: del,
    }
}
