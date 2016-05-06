using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChurchHelper.BusinessInterfaces;
using ChurchHelper.BusinessManagers;
using ChurchHelper.BusinessModels;
using ChurchHelper.SystemInterfaces;
using ChurchHelper.SystemManagers;
using ChurchHelper.SystemModels;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Hosting;
using Microsoft.Dnx.Runtime;
using Microsoft.Framework.Configuration;
using Microsoft.Framework.DependencyInjection;
using Microsoft.Framework.Logging;

namespace ChurchHelper
{
    public class Startup
    {
        public Startup(IHostingEnvironment env, IApplicationEnvironment appEnv)
        {
            // Setup configuration sources.
            var builder = new ConfigurationBuilder()
                .SetBasePath(appEnv.ApplicationBasePath)
                .AddJsonFile($"app_config/config.{env.EnvironmentName}.json")
                .AddJsonFile("app_data/BibleLists.json")  //todo general exception handler an logger .. ie if file not found
                .AddEnvironmentVariables();
            Configuration = builder.Build();
        }

        public IConfigurationRoot Configuration { get; set; }

        // This method gets called by the runtime.
        public void ConfigureServices(IServiceCollection services)
        {
            // Add MVC services to the services container.
            services.AddMvc();
            services.Configure<List<Bible>>(Configuration.GetSection("BibleList"));  // it is registered as IOption<Bible> service now
            services.Configure<Config>(Configuration.GetSection("Config"));  // it is registered as IOption<Bible> service now

            services.AddTransient<ISerializer, NewtonSoftSerializer>();
            services.AddTransient<IRequestClient, RequestClient>();
            services.AddTransient<IRequestManager, RequestManager>();
            services.AddTransient<IBibleRepository, BibleRepository>();
            services.AddTransient<IBibleManager, BibleManager>();
        }

        // Configure is called after ConfigureServices is called.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.MinimumLevel = LogLevel.Information;
            loggerFactory.AddConsole();
            loggerFactory.AddDebug();

            // Configure the HTTP request pipeline.

            // Add the following to the request pipeline only in development environment.
            if (env.IsDevelopment())
            {
                app.UseBrowserLink();
                app.UseDeveloperExceptionPage();
            }
            else
            {
                // Add Error handling middleware which catches all application specific errors and
                // send the request to the following path or controller action.
                app.UseExceptionHandler("/Home/Error");
            }

            // Add the platform handler to the request pipeline.
            app.UseIISPlatformHandler();

            // Add static files to the request pipeline.
            app.UseStaticFiles();

            // Add MVC to the request pipeline.
            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");

                // Uncomment the following line to add a route for porting Web API 2 controllers.
                // routes.MapWebApiRoute("DefaultApi", "api/{controller}/{id?}");
            });
        }
    }
}
