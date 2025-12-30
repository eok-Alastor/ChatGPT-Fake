# ConversationsApi

All URIs are relative to *http://localhost:3000/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createConversation**](#createconversation) | **POST** /conversations | 创建个人对话|
|[**deleteConversation**](#deleteconversation) | **DELETE** /conversations/{conversationId} | 删除对话|
|[**getConversationById**](#getconversationbyid) | **GET** /conversations/{conversationId} | 获取对话详情|
|[**getConversations**](#getconversations) | **GET** /conversations | 获取用户的所有对话|
|[**updateConversationTags**](#updateconversationtags) | **PATCH** /conversations/{conversationId}/tags | 更新对话标签|
|[**updateConversationTitle**](#updateconversationtitle) | **PATCH** /conversations/{conversationId} | 更新对话标题|

# **createConversation**
> CreateConversation201Response createConversation()


### Example

```typescript
import {
    ConversationsApi,
    Configuration,
    CreateConversationRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ConversationsApi(configuration);

let createConversationRequest: CreateConversationRequest; // (optional)

const { status, data } = await apiInstance.createConversation(
    createConversationRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createConversationRequest** | **CreateConversationRequest**|  | |


### Return type

**CreateConversation201Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | 创建成功 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteConversation**
> ApiResponse deleteConversation()


### Example

```typescript
import {
    ConversationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ConversationsApi(configuration);

let conversationId: string; //对话 ID (default to undefined)

const { status, data } = await apiInstance.deleteConversation(
    conversationId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **conversationId** | [**string**] | 对话 ID | defaults to undefined|


### Return type

**ApiResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 删除成功 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getConversationById**
> CreateConversation201Response getConversationById()


### Example

```typescript
import {
    ConversationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ConversationsApi(configuration);

let conversationId: string; //对话 ID (default to undefined)

const { status, data } = await apiInstance.getConversationById(
    conversationId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **conversationId** | [**string**] | 对话 ID | defaults to undefined|


### Return type

**CreateConversation201Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 成功 |  -  |
|**404** | 对话不存在 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getConversations**
> GetConversations200Response getConversations()


### Example

```typescript
import {
    ConversationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ConversationsApi(configuration);

let tag: string; //按标签筛选 (optional) (default to undefined)
let page: number; // (optional) (default to 1)
let limit: number; // (optional) (default to 20)

const { status, data } = await apiInstance.getConversations(
    tag,
    page,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **tag** | [**string**] | 按标签筛选 | (optional) defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to 1|
| **limit** | [**number**] |  | (optional) defaults to 20|


### Return type

**GetConversations200Response**

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

# **updateConversationTags**
> CreateConversation201Response updateConversationTags(updateConversationTagsRequest)


### Example

```typescript
import {
    ConversationsApi,
    Configuration,
    UpdateConversationTagsRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ConversationsApi(configuration);

let conversationId: string; //对话 ID (default to undefined)
let updateConversationTagsRequest: UpdateConversationTagsRequest; //

const { status, data } = await apiInstance.updateConversationTags(
    conversationId,
    updateConversationTagsRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateConversationTagsRequest** | **UpdateConversationTagsRequest**|  | |
| **conversationId** | [**string**] | 对话 ID | defaults to undefined|


### Return type

**CreateConversation201Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 更新成功 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateConversationTitle**
> CreateConversation201Response updateConversationTitle(updateConversationTitleRequest)


### Example

```typescript
import {
    ConversationsApi,
    Configuration,
    UpdateConversationTitleRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ConversationsApi(configuration);

let conversationId: string; //对话 ID (default to undefined)
let updateConversationTitleRequest: UpdateConversationTitleRequest; //

const { status, data } = await apiInstance.updateConversationTitle(
    conversationId,
    updateConversationTitleRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateConversationTitleRequest** | **UpdateConversationTitleRequest**|  | |
| **conversationId** | [**string**] | 对话 ID | defaults to undefined|


### Return type

**CreateConversation201Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | 更新成功 |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

