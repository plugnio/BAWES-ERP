'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">bawes-erp documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-747104a7bbb58a000fda3087eb2b4db0b6be1f2de4d7f6544772265a49fc9b4cf7b2ce34f2c98374cc660d62f3e61e68d3f9f3f6414f75bdb5f9e10d81453bfe"' : 'data-bs-target="#xs-controllers-links-module-AppModule-747104a7bbb58a000fda3087eb2b4db0b6be1f2de4d7f6544772265a49fc9b4cf7b2ce34f2c98374cc660d62f3e61e68d3f9f3f6414f75bdb5f9e10d81453bfe"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-747104a7bbb58a000fda3087eb2b4db0b6be1f2de4d7f6544772265a49fc9b4cf7b2ce34f2c98374cc660d62f3e61e68d3f9f3f6414f75bdb5f9e10d81453bfe"' :
                                            'id="xs-controllers-links-module-AppModule-747104a7bbb58a000fda3087eb2b4db0b6be1f2de4d7f6544772265a49fc9b4cf7b2ce34f2c98374cc660d62f3e61e68d3f9f3f6414f75bdb5f9e10d81453bfe"' }>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-747104a7bbb58a000fda3087eb2b4db0b6be1f2de4d7f6544772265a49fc9b4cf7b2ce34f2c98374cc660d62f3e61e68d3f9f3f6414f75bdb5f9e10d81453bfe"' : 'data-bs-target="#xs-injectables-links-module-AppModule-747104a7bbb58a000fda3087eb2b4db0b6be1f2de4d7f6544772265a49fc9b4cf7b2ce34f2c98374cc660d62f3e61e68d3f9f3f6414f75bdb5f9e10d81453bfe"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-747104a7bbb58a000fda3087eb2b4db0b6be1f2de4d7f6544772265a49fc9b4cf7b2ce34f2c98374cc660d62f3e61e68d3f9f3f6414f75bdb5f9e10d81453bfe"' :
                                        'id="xs-injectables-links-module-AppModule-747104a7bbb58a000fda3087eb2b4db0b6be1f2de4d7f6544772265a49fc9b4cf7b2ce34f2c98374cc660d62f3e61e68d3f9f3f6414f75bdb5f9e10d81453bfe"' }>
                                        <li class="link">
                                            <a href="injectables/AppService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AuthModule-fa39f2f77d971108815222730bdb7064b43812d7162c27125dc9bbe6eb03f9f911837e41272d223775b6617e5bd1fa90dc5d56acef16bb5b052c7f99e2311312"' : 'data-bs-target="#xs-controllers-links-module-AuthModule-fa39f2f77d971108815222730bdb7064b43812d7162c27125dc9bbe6eb03f9f911837e41272d223775b6617e5bd1fa90dc5d56acef16bb5b052c7f99e2311312"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-fa39f2f77d971108815222730bdb7064b43812d7162c27125dc9bbe6eb03f9f911837e41272d223775b6617e5bd1fa90dc5d56acef16bb5b052c7f99e2311312"' :
                                            'id="xs-controllers-links-module-AuthModule-fa39f2f77d971108815222730bdb7064b43812d7162c27125dc9bbe6eb03f9f911837e41272d223775b6617e5bd1fa90dc5d56acef16bb5b052c7f99e2311312"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-fa39f2f77d971108815222730bdb7064b43812d7162c27125dc9bbe6eb03f9f911837e41272d223775b6617e5bd1fa90dc5d56acef16bb5b052c7f99e2311312"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-fa39f2f77d971108815222730bdb7064b43812d7162c27125dc9bbe6eb03f9f911837e41272d223775b6617e5bd1fa90dc5d56acef16bb5b052c7f99e2311312"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-fa39f2f77d971108815222730bdb7064b43812d7162c27125dc9bbe6eb03f9f911837e41272d223775b6617e5bd1fa90dc5d56acef16bb5b052c7f99e2311312"' :
                                        'id="xs-injectables-links-module-AuthModule-fa39f2f77d971108815222730bdb7064b43812d7162c27125dc9bbe6eb03f9f911837e41272d223775b6617e5bd1fa90dc5d56acef16bb5b052c7f99e2311312"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PersonModule.html" data-type="entity-link" >PersonModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-PersonModule-a847939a121017bbcdfd75c9b403b7c1b592269dd8510e67e4ae7a682e46c11ac5bf2b8bc0a473212c6ef177b9fcaa30374ab6f1d6f19b158a3ac7d68479f86e"' : 'data-bs-target="#xs-controllers-links-module-PersonModule-a847939a121017bbcdfd75c9b403b7c1b592269dd8510e67e4ae7a682e46c11ac5bf2b8bc0a473212c6ef177b9fcaa30374ab6f1d6f19b158a3ac7d68479f86e"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PersonModule-a847939a121017bbcdfd75c9b403b7c1b592269dd8510e67e4ae7a682e46c11ac5bf2b8bc0a473212c6ef177b9fcaa30374ab6f1d6f19b158a3ac7d68479f86e"' :
                                            'id="xs-controllers-links-module-PersonModule-a847939a121017bbcdfd75c9b403b7c1b592269dd8510e67e4ae7a682e46c11ac5bf2b8bc0a473212c6ef177b9fcaa30374ab6f1d6f19b158a3ac7d68479f86e"' }>
                                            <li class="link">
                                                <a href="controllers/PersonController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PersonController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PersonModule-a847939a121017bbcdfd75c9b403b7c1b592269dd8510e67e4ae7a682e46c11ac5bf2b8bc0a473212c6ef177b9fcaa30374ab6f1d6f19b158a3ac7d68479f86e"' : 'data-bs-target="#xs-injectables-links-module-PersonModule-a847939a121017bbcdfd75c9b403b7c1b592269dd8510e67e4ae7a682e46c11ac5bf2b8bc0a473212c6ef177b9fcaa30374ab6f1d6f19b158a3ac7d68479f86e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PersonModule-a847939a121017bbcdfd75c9b403b7c1b592269dd8510e67e4ae7a682e46c11ac5bf2b8bc0a473212c6ef177b9fcaa30374ab6f1d6f19b158a3ac7d68479f86e"' :
                                        'id="xs-injectables-links-module-PersonModule-a847939a121017bbcdfd75c9b403b7c1b592269dd8510e67e4ae7a682e46c11ac5bf2b8bc0a473212c6ef177b9fcaa30374ab6f1d6f19b158a3ac7d68479f86e"' }>
                                        <li class="link">
                                            <a href="injectables/PersonService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PersonService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PrismaModule.html" data-type="entity-link" >PrismaModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PrismaModule-0a30996d1235bf2604a3c3e09c8f1199d43cb26cc3a3c409db2ea23ad71bf181806b1da96cfc90d204e717a917b83b7d35bd1c8bff82b9170de5064b4a322113"' : 'data-bs-target="#xs-injectables-links-module-PrismaModule-0a30996d1235bf2604a3c3e09c8f1199d43cb26cc3a3c409db2ea23ad71bf181806b1da96cfc90d204e717a917b83b7d35bd1c8bff82b9170de5064b4a322113"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PrismaModule-0a30996d1235bf2604a3c3e09c8f1199d43cb26cc3a3c409db2ea23ad71bf181806b1da96cfc90d204e717a917b83b7d35bd1c8bff82b9170de5064b4a322113"' :
                                        'id="xs-injectables-links-module-PrismaModule-0a30996d1235bf2604a3c3e09c8f1199d43cb26cc3a3c409db2ea23ad71bf181806b1da96cfc90d204e717a917b83b7d35bd1c8bff82b9170de5064b4a322113"' }>
                                        <li class="link">
                                            <a href="injectables/PrismaService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PrismaService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RbacModule.html" data-type="entity-link" >RbacModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-RbacModule-ee247a56444552c7d8d93375e5613261cf143359238294a30b7620c060f4980496521ed18247ba82e7b8b5a8cbda0380fb62f71d470c2caa0c8b49aca98b1714"' : 'data-bs-target="#xs-controllers-links-module-RbacModule-ee247a56444552c7d8d93375e5613261cf143359238294a30b7620c060f4980496521ed18247ba82e7b8b5a8cbda0380fb62f71d470c2caa0c8b49aca98b1714"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-RbacModule-ee247a56444552c7d8d93375e5613261cf143359238294a30b7620c060f4980496521ed18247ba82e7b8b5a8cbda0380fb62f71d470c2caa0c8b49aca98b1714"' :
                                            'id="xs-controllers-links-module-RbacModule-ee247a56444552c7d8d93375e5613261cf143359238294a30b7620c060f4980496521ed18247ba82e7b8b5a8cbda0380fb62f71d470c2caa0c8b49aca98b1714"' }>
                                            <li class="link">
                                                <a href="controllers/PermissionManagementController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PermissionManagementController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/RoleManagementController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoleManagementController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RbacModule-ee247a56444552c7d8d93375e5613261cf143359238294a30b7620c060f4980496521ed18247ba82e7b8b5a8cbda0380fb62f71d470c2caa0c8b49aca98b1714"' : 'data-bs-target="#xs-injectables-links-module-RbacModule-ee247a56444552c7d8d93375e5613261cf143359238294a30b7620c060f4980496521ed18247ba82e7b8b5a8cbda0380fb62f71d470c2caa0c8b49aca98b1714"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RbacModule-ee247a56444552c7d8d93375e5613261cf143359238294a30b7620c060f4980496521ed18247ba82e7b8b5a8cbda0380fb62f71d470c2caa0c8b49aca98b1714"' :
                                        'id="xs-injectables-links-module-RbacModule-ee247a56444552c7d8d93375e5613261cf143359238294a30b7620c060f4980496521ed18247ba82e7b8b5a8cbda0380fb62f71d470c2caa0c8b49aca98b1714"' }>
                                        <li class="link">
                                            <a href="injectables/PermissionDiscoveryService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PermissionDiscoveryService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PermissionManagementService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PermissionManagementService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RedisCacheModule.html" data-type="entity-link" >RedisCacheModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/CreatePersonDto.html" data-type="entity-link" >CreatePersonDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateRoleDto.html" data-type="entity-link" >CreateRoleDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginDto.html" data-type="entity-link" >LoginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/Person.html" data-type="entity-link" >Person</a>
                            </li>
                            <li class="link">
                                <a href="classes/RefreshTokenDto.html" data-type="entity-link" >RefreshTokenDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RegisterDto.html" data-type="entity-link" >RegisterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdatePersonDto.html" data-type="entity-link" >UpdatePersonDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/VerifyEmailDto.html" data-type="entity-link" >VerifyEmailDto</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/JwtAuthGuard.html" data-type="entity-link" >JwtAuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RedisHealthIndicator.html" data-type="entity-link" >RedisHealthIndicator</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/PermissionGuard.html" data-type="entity-link" >PermissionGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/PermissionGuard-1.html" data-type="entity-link" >PermissionGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/JwtPayload.html" data-type="entity-link" >JwtPayload</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});