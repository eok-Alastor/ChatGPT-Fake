# GroupsApi

All URIs are relative to *http://localhost:3000/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createGroupConversation**](#creategroupconversation) | **POST** /group-conversations | 创建群组|
|[**deleteGroupConversation**](#deletegroupconversation) | **DELETE** /group-conversations/{groupId} | 删除群组|
|[**getGroupConversationById**](#getgroupconversationbyid) | **GET** /group-conversations/{groupId} | 获取群组详情|
|[**getGroupConversations**](#getgroupconversations) | **GET** /group-conversations | 获取用户的所有群组|

# **createGroupConversation**
> CreateGroupConversation201Response createGroupConversation(createGroupRequest)


### Example

```typescript
import {
    GroupsApi,
    Configuration,
    CreateGroupRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new GroupsApi(configuration);

let createGroupRequest: CreateGroupRequest; //

const { status, data } = await apiInstance.createGroupConversation(
    createGroupRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createGroupRequest** | **CreateGroupRequest**|  | |


### Return type

**CreateGroupConversation201Response**

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

# **deleteGroupConversation**
> ApiResponse deleteGroupConversation()


### Example

```typescript
import {
    GroupsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new GroupsApi(configuration);

let groupId: string; //群组 ID (default to undefined)

const { status, data } = await apiInstance.deleteGroupConversation(
    groupId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] | 群组 ID | defaults to undefined|


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

# **getGroupConversationById**
> GetGroupConversationById200Response getGroupConversationById()


### Example

```typescript
import {
    GroupsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new GroupsApi(configuration);

let groupId: string; //群组 ID (default to undefined)

const { status, data } = await apiInstance.getGroupConversationById(
    groupId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupId** | [**string**] | 群组 ID | defaults to undefined|


### Return type

**GetGroupConversationById200Response**

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

# **getGroupConversations**
> GetGroupConversations200Response getGroupConversations()


### Example

```typescript
import {
    GroupsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new GroupsApi(configuration);

const { status, data } = await apiInstance.getGroupConversations();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**GetGroupConversations200Response**

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

