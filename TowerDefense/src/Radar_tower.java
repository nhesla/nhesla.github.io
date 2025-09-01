import java.awt.*;   
import java.applet.Applet; 
import java.util.Random; 

 
public class Radar_tower extends Tower
{
	public Radar_tower(int x, int y, int d)
	{
		super(x,y,d);
	}
	public Radar_tower(Tower copy, int d)
	{
		super(copy,d);
	}
	
	public int getUpD()
	{
		int num=0;
		
		if(damage < 4)
			for(int count=0; count < damage; count ++)
			{
				num += count+1;
			}
		
		return num*1000;
	}
	public int getUpR()
	{
		int num=0;
		
		if(range < 4)
			for(int count=0; count < range; count ++)
			{
				num += count+1;
			}
		
		return num*1000;
	}
	public int getUpT()
	{
		int num=0;
		
		if(rate < 4)
			for(int count=0; count < rate; count ++)
			{
				num += count+1;
			}
		
		return num*1000;
	}
	public int getUpS()
	{
		int num1=100;
		int num2=0;
		
		for(int count=0; count < rate-1; count ++)
		{
			num2 += count+1;
		}
		for(int count=0; count < range-1; count ++)
		{
			num2 += count+1;
		}
		for(int count=0; count < rate-1; count ++)
		{
			num2 += count+1;
		} 
		
		return num1 + num2*1000/3;
	}
	
	public void drawTower(Graphics g)
	{
		////radar tower///////
		if(angle < 360)
		{
			angle += 5;
		}
		else
		{
			angle = 0;
		}
		double vector = angle * Math.PI*2 / 360.0;
		g.setColor(Color.green);
		
		Polygon part1 = new Polygon();
		part1.addPoint((int)((getX()+(25/diviser)*Math.sin(vector))+(3/diviser)*Math.cos(vector)),(int)((getY()+(3/diviser)*Math.sin(vector))-(25/diviser)*Math.cos(vector)));
       	part1.addPoint((int)((getX()+(25/diviser)*Math.sin(vector))-(3/diviser)*Math.cos(vector)),(int)((getY()-(3/diviser)*Math.sin(vector))-(25/diviser)*Math.cos(vector)));
       	part1.addPoint((int)((getX()+(0/diviser)*Math.sin(vector))-(3/diviser)*Math.cos(vector)),(int)((getY()-(3/diviser)*Math.sin(vector))-(0/diviser)*Math.cos(vector)));
       	part1.addPoint((int)((getX()+(0/diviser)*Math.sin(vector))+(3/diviser)*Math.cos(vector)),(int)((getY()+(3/diviser)*Math.sin(vector))-(0/diviser)*Math.cos(vector)));
       	part1.addPoint((int)((getX()+(25/diviser)*Math.sin(vector))+(3/diviser)*Math.cos(vector)),(int)((getY()+(3/diviser)*Math.sin(vector))-(25/diviser)*Math.cos(vector)));
			
		g.fillPolygon(part1);
		g.fillArc(getX()-(15/diviser),getY()-(15/diviser),(30/diviser),(30/diviser),150-angle,240);
		
		g.setColor(Color.blue);
		g.drawPolygon(part1);
		g.drawArc(getX()-(15/diviser),getY()-(15/diviser),(30/diviser),(30/diviser),150-angle,240);
		
		//////radar sweep//////
		if(reload < 200)
		{
			reload += 5;	
		}
		else
		{
			reload = 0;
		}
		
		g.setColor(Color.white);
		g.drawOval(getX()-(reload/2)/diviser, getY()-(reload/2)/diviser, reload/diviser, reload/diviser);
	}
}