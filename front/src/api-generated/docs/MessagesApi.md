# MessagesApi

All URIs are relative to *http://localhost:3000/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getGroupMessages**](#getgroupmessages) | **GET** /group-conversations/{groupId}/messages | 获取群组消息历史|
|[**getMessages**](#getmessages) | **GET** /conversations/{conversationId}/messages | 获取对话的所有消息|
|[**sendGroupMessage**](#sendgroupmessage) | **POST** /group-conversations/{groupId}/messages | 发送群组消息|
|[**sendMessage**](#sendmessage) | **POST** /conversations/{conversationId}/messages | 发送消息|

# **getGroupMessages**
> GetMessages200Response getGroupMessages()


### Example

```typescript
import {
    MessagesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MessagesApi(configuration);

let groupId: string; //群组 ID (default to undefined)
let page: number; // (optional) (default to 1)
let limit: number; // (optional) (default to 50)

const { status, data } = await apiInstance.getGroupMessages(
    groupId,
    page,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] | 群组 ID | defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to 1|
| **limit** | [**number**] |  | (optional) defaults to 50|


### Return type

**GetMessages200Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 成功 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getMessages**
> GetMessages200Response getMessages()


### Example

```typescript
import {
    MessagesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MessagesApi(configuration);

let conversationId: string; //对话 ID (default to undefined)
let page: number; // (optional) (default to 1)
let limit: number; // (optional) (default to 50)

const { status, data } = await apiInstance.getMessages(
    conversationId,
    page,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **conversationId** | [**string**] | 对话 ID | defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to 1|
| **limit** | [**number**] |  | (optional) defaults to 50|


### Return type

**GetMessages200Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 成功 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sendGroupMessage**
> SendGroupMessage201Response sendGroupMessage(sendMessageRequest)


### Example

```typescript
import {
    MessagesApi,
    Configuration,
    SendMessageRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new MessagesApi(configuration);

let groupId: string; //群组 ID (default to undefined)
let sendMessageRequest: SendMessageRequest; //

const { status, data } = await apiInstance.sendGroupMessage(
    groupId,
    sendMessageRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **sendMessageRequest** | **SendMessageRequest**|  | |
| **groupId** | [**string**] | 群组 ID | defaults to undefined|


### Return type

**SendGroupMessage201Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | 发送成功 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sendMessage**
> SendMessage201Response sendMessage(sendMessageRequest)


### Example

```typescript
import {
    MessagesApi,
    Configuration,
    SendMessageRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new MessagesApi(configuration);

let conversationId: string; //对话 ID (default to undefined)
let sendMessageRequest: SendMessageRequest; //

const { status, data } = await apiInstance.sendMessage(
    conversationId,
    sendMessageRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **sendMessageRequest** | **SendMessageRequest**|  | |
| **conversationId** | [**string**] | 对话 ID | defaults to undefined|


### Return type

**SendMessage201Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | 发送成功 |  -  |
|**202** | AI 调用失败 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

