import { LinkBuilder } from '../interfaces/hateoas.interface';

/**
 * Common HATEOAS link builders for typical REST operations
 */
export class CommonLinkBuilders {
  /**
   * Self link - points to the current resource
   */
  static self(resourcePath: string): LinkBuilder {
    return {
      rel: 'self',
      href: (resource: any) => `${resourcePath}/${resource.id}`,
      method: 'GET',
    };
  }

  /**
   * Edit link - points to update endpoint
   */
  static edit(resourcePath: string): LinkBuilder {
    return {
      rel: 'edit',
      href: (resource: any) => `${resourcePath}/${resource.id}`,
      method: 'PUT',
      title: 'Update this resource',
    };
  }

  /**
   * Delete link - points to delete endpoint
   */
  static delete(resourcePath: string): LinkBuilder {
    return {
      rel: 'delete',
      href: (resource: any) => `${resourcePath}/${resource.id}`,
      method: 'DELETE',
      title: 'Delete this resource',
    };
  }

  /**
   * Collection link - points to the collection
   */
  static collection(resourcePath: string): LinkBuilder {
    return {
      rel: 'collection',
      href: resourcePath,
      method: 'GET',
      title: 'View all resources',
    };
  }

  /**
   * Create link - points to create endpoint
   */
  static create(resourcePath: string): LinkBuilder {
    return {
      rel: 'create',
      href: resourcePath,
      method: 'POST',
      title: 'Create new resource',
    };
  }

  /**
   * Related resource link
   */
  static related(
    rel: string,
    resourcePath: string,
    idField: string = 'id',
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  ): LinkBuilder {
    return {
      rel,
      href: (resource: any) => `${resourcePath}/${resource[idField]}`,
      method,
    };
  }

  /**
   * Conditional link - only shows if condition is met
   */
  static conditional(
    rel: string,
    href: string | ((resource: any) => string),
    condition: (resource: any, req?: any) => boolean,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  ): LinkBuilder {
    return {
      rel,
      href,
      method,
      condition,
    };
  }
}

/**
 * Specific link builders for the application's resources
 */
export class AppLinkBuilders {
  /**
   * User-specific links
   */
  static userLinks(): LinkBuilder[] {
    return [
      CommonLinkBuilders.self('/users'),
      CommonLinkBuilders.edit('/users'),
      CommonLinkBuilders.delete('/users'),
      CommonLinkBuilders.collection('/users'),
      {
        rel: 'ban',
        href: (resource: any) => `/users/${resource.id}/bans`,
        method: 'POST',
        title: 'Ban this user',
        condition: (resource: any, req: any) => {
          // Only show ban link for admins and if user is not already banned
          return req.user?.isAdmin && !resource.isBanned;
        },
      },
      {
        rel: 'unban',
        href: (resource: any) => `/users/${resource.id}/bans`,
        method: 'DELETE',
        title: 'Unban this user',
        condition: (resource: any, req: any) => {
          // Only show unban link for admins and if user is banned
          return req.user?.isAdmin && resource.isBanned;
        },
      },
      {
        rel: 'ban-status',
        href: (resource: any) => `/users/${resource.id}/bans`,
        method: 'GET',
        title: 'Check ban status',
        condition: (resource: any, req: any) => req.user?.isAdmin,
      },
    ];
  }

  /**
   * Profile-specific links
   */
  static profileLinks(): LinkBuilder[] {
    return [
      CommonLinkBuilders.self('/profiles'),
      CommonLinkBuilders.edit('/profiles'),
      CommonLinkBuilders.delete('/profiles'),
      CommonLinkBuilders.collection('/profiles'),
      {
        rel: 'images',
        href: (resource: any) => `/profiles/${resource.id}/images`,
        method: 'GET',
        title: 'View profile images',
      },
      {
        rel: 'upload-image',
        href: (resource: any) => `/profiles/${resource.id}/images`,
        method: 'POST',
        title: 'Upload profile image',
        type: 'multipart/form-data',
      },
      {
        rel: 'matches',
        href: '/matches',
        method: 'GET',
        title: 'View matches',
      },
      {
        rel: 'pending-matches',
        href: '/matches/pending',
        method: 'GET',
        title: 'View pending matches',
      },
      {
        rel: 'sent-matches',
        href: '/matches/sent',
        method: 'GET',
        title: 'View sent likes',
      },
    ];
  }

  /**
   * Match-specific links
   */
  static matchLinks(): LinkBuilder[] {
    return [
      {
        rel: 'self',
        href: (resource: any) => `/matches/${resource.profileId}`,
        method: 'GET',
      },
      {
        rel: 'like',
        href: (resource: any) => `/matches/${resource.profileId}/like`,
        method: 'POST',
        title: 'Like this profile',
        condition: (resource: any) => !resource.isLiked,
      },
      {
        rel: 'unlike',
        href: (resource: any) => `/matches/${resource.profileId}/unlike`,
        method: 'DELETE',
        title: 'Unlike this profile',
        condition: (resource: any) => resource.isLiked,
      },
      {
        rel: 'pass',
        href: (resource: any) => `/matches/${resource.profileId}/pass`,
        method: 'POST',
        title: 'Pass on this profile',
        condition: (resource: any) => !resource.isPassed,
      },
      {
        rel: 'profile',
        href: (resource: any) => `/profiles/${resource.profileId}`,
        method: 'GET',
        title: 'View full profile',
      },
      CommonLinkBuilders.collection('/matches'),
    ];
  }

  /**
   * Profile image-specific links
   */
  static profileImageLinks(): LinkBuilder[] {
    return [
      {
        rel: 'self',
        href: (resource: any) =>
          `/profiles/${resource.profileId}/images/${resource.index}`,
        method: 'GET',
      },
      {
        rel: 'update',
        href: (resource: any) =>
          `/profiles/${resource.profileId}/images/${resource.index}`,
        method: 'PUT',
        title: 'Update this image',
        type: 'multipart/form-data',
      },
      {
        rel: 'delete',
        href: (resource: any) =>
          `/profiles/${resource.profileId}/images/${resource.index}`,
        method: 'DELETE',
        title: 'Delete this image',
      },
      {
        rel: 'profile',
        href: (resource: any) => `/profiles/${resource.profileId}`,
        method: 'GET',
        title: 'View profile',
      },
      {
        rel: 'collection',
        href: (resource: any) => `/profiles/${resource.profileId}/images`,
        method: 'GET',
        title: 'View all profile images',
      },
    ];
  }

  /**
   * Booster-specific links
   */
  static boosterLinks(): LinkBuilder[] {
    return [
      CommonLinkBuilders.self('/boosters'),
      CommonLinkBuilders.collection('/boosters'),
      {
        rel: 'purchase',
        href: (resource: any) => `/boosters/${resource.id}/purchase`,
        method: 'POST',
        title: 'Purchase this booster',
        condition: (resource: any) => resource.isAvailable,
      },
      {
        rel: 'use',
        href: (resource: any) => `/boosters/${resource.id}/use`,
        method: 'POST',
        title: 'Use this booster',
        condition: (resource: any) => resource.isOwned && !resource.isUsed,
      },
    ];
  }

  /**
   * Booster collection-specific links (for list endpoints)
   */
  static boosterCollectionLinks(): LinkBuilder[] {
    return [
      {
        rel: 'create',
        href: '/booster',
        method: 'POST',
        title: 'Create new booster pack',
        condition: (resource: any, req: any) => req.user?.isAdmin,
      },
      {
        rel: 'purchase',
        href: '/booster/purchase',
        method: 'POST',
        title: 'Purchase booster pack',
      },
    ];
  }

  /**
   * Report-specific links
   */
  static reportLinks(): LinkBuilder[] {
    return [
      CommonLinkBuilders.self('/reports'),
      CommonLinkBuilders.collection('/reports'),
      {
        rel: 'resolve',
        href: (resource: any) => `/reports/${resource.id}/resolve`,
        method: 'POST',
        title: 'Resolve this report',
        condition: (resource: any, req: any) =>
          req.user?.isAdmin && resource.status === 'pending',
      },
      {
        rel: 'dismiss',
        href: (resource: any) => `/reports/${resource.id}/dismiss`,
        method: 'POST',
        title: 'Dismiss this report',
        condition: (resource: any, req: any) =>
          req.user?.isAdmin && resource.status === 'pending',
      },
      {
        rel: 'reported-profile',
        href: (resource: any) => `/profiles/${resource.reportedProfileId}`,
        method: 'GET',
        title: 'View reported profile',
      },
      {
        rel: 'reporter-profile',
        href: (resource: any) => `/profiles/${resource.reporterProfileId}`,
        method: 'GET',
        title: 'View reporter profile',
      },
    ];
  }

  /**
   * Settings-specific links
   */
  static settingsLinks(): LinkBuilder[] {
    return [
      CommonLinkBuilders.self('/settings'),
      CommonLinkBuilders.edit('/settings'),
      {
        rel: 'profile',
        href: '/profiles/me',
        method: 'GET',
        title: 'View my profile',
      },
    ];
  }

  /**
   * Stats-specific links
   */
  static statsLinks(): LinkBuilder[] {
    return [
      CommonLinkBuilders.self('/stats'),
      {
        rel: 'app-stats',
        href: '/stats/app',
        method: 'GET',
        title: 'View application statistics',
      },
      {
        rel: 'booster-stats',
        href: '/stats/boosters',
        method: 'GET',
        title: 'View booster statistics',
      },
      {
        rel: 'detailed-stats',
        href: '/stats/detailed',
        method: 'GET',
        title: 'View detailed statistics',
      },
      {
        rel: 'comprehensive-stats',
        href: '/stats/comprehensive',
        method: 'GET',
        title: 'View comprehensive statistics',
      },
      {
        rel: 'user-demographics',
        href: '/stats/demographics',
        method: 'GET',
        title: 'View user demographics',
      },
      {
        rel: 'engagement-stats',
        href: '/stats/engagement',
        method: 'GET',
        title: 'View engagement statistics',
      },
      {
        rel: 'activity-stats',
        href: '/stats/activity',
        method: 'GET',
        title: 'View activity statistics',
      },
      {
        rel: 'users-count',
        href: '/stats/users/count',
        method: 'GET',
        title: 'Get total users count',
      },
      {
        rel: 'matches-count',
        href: '/stats/matches/count',
        method: 'GET',
        title: 'Get total matches count',
      },
      {
        rel: 'profile',
        href: '/profiles/me',
        method: 'GET',
        title: 'View my profile',
      },
      {
        rel: 'matches',
        href: '/matches',
        method: 'GET',
        title: 'View my matches',
      },
      {
        rel: 'booster-list',
        href: '/booster/list',
        method: 'GET',
        title: 'View available boosters',
      },
    ];
  }
}
