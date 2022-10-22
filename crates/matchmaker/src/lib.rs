#[macro_use]
extern crate tracing;

use std::net::SocketAddr;

use quinn::{Endpoint, EndpointConfig, ServerConfig, TokioRuntime};

mod certs;
pub mod cli;
mod connection;

#[derive(clap::Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Config {
    /// The server address to listen on
    #[clap(short, long = "listen", default_value = "0.0.0.0:8943")]
    listen_addr: SocketAddr,
}

#[tokio::main]
async fn server(args: Config) -> anyhow::Result<()> {
    // Generate certificate
    let (cert, key) = certs::generate_self_signed_cert()?;
    let server_config = ServerConfig::with_single_cert([cert].to_vec(), key)?;

    // Open Socket and create endpoint
    let socket = std::net::UdpSocket::bind(args.listen_addr)?;
    let (endpoint, mut incoming) = Endpoint::new(
        EndpointConfig::default(),
        Some(server_config),
        socket,
        TokioRuntime,
    )?;
    info!(address=%endpoint.local_addr()?, "Started server");

    // Listen for incomming connections
    while let Some(connecting) = incoming.next().await {
        let connection = connecting.await;

        match connection {
            Ok(conn) => {
                info!(client_id = "TODO", "Opened connection from client!");

                // Spawn a task to handle the new connection
                tokio::spawn(async move {
                    if let Err(e) = connection::handle_new_connection(conn).await {
                        error!("Connection error: {e:?}");
                    }
                });
            }
            Err(e) => error!("Error opening client connection: {e:?}"),
        }
    }

    info!("Server shutdown");

    Ok(())
}
